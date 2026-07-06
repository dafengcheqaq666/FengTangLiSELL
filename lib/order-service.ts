import { Prisma, OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { makeOrderNo } from "@/lib/money";
import type { z } from "zod";
import type { createOrderSchema } from "@/lib/validation";

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class StoreError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export async function createOrder(input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const zone = await tx.shippingZone.findUnique({ where: { province: input.address.province } });
    if (!zone?.enabled) throw new StoreError("UNDELIVERABLE", "当前地区暂不支持配送");

    const ids = [...new Set(input.lines.map((line) => line.variantId))];
    const variants = await tx.productVariant.findMany({
      where: { id: { in: ids }, active: true, product: { active: true } },
      include: { product: true },
    });
    if (variants.length !== ids.length) throw new StoreError("PRODUCT_CHANGED", "部分商品已下架，请刷新购物车");

    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    let subtotalFen = 0;
    const itemData = input.lines.map((line) => {
      const variant = byId.get(line.variantId)!;
      subtotalFen += variant.priceFen * line.quantity;
      return { line, variant };
    });

    for (const { line, variant } of itemData) {
      const reserved = await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET "stockReserved" = "stockReserved" + ${line.quantity}, "updatedAt" = NOW()
        WHERE "id" = ${variant.id}
          AND "active" = true
          AND "stockOnHand" - "stockReserved" >= ${line.quantity}
      `;
      if (reserved !== 1) throw new StoreError("OUT_OF_STOCK", `${variant.name} 库存不足`, 409);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return tx.order.create({
      data: {
        orderNo: makeOrderNo(),
        subtotalFen,
        shippingFen: zone.feeFen,
        totalFen: subtotalFen + zone.feeFen,
        ...input.address,
        expiresAt,
        items: {
          create: itemData.map(({ line, variant }) => ({
            variantId: variant.id,
            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPriceFen: variant.priceFen,
            quantity: line.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createPaymentAttempt(orderNo: string, provider: PaymentProvider, channel: string) {
  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) throw new StoreError("ORDER_NOT_FOUND", "订单不存在", 404);
  if (order.status !== OrderStatus.PENDING_PAYMENT || order.expiresAt <= new Date()) {
    throw new StoreError("ORDER_NOT_PAYABLE", "订单已支付或已过期", 409);
  }
  return prisma.paymentAttempt.create({
    data: {
      orderId: order.id,
      provider,
      channel,
      amountFen: order.totalFen,
      merchantTradeNo: makeOrderNo(provider === PaymentProvider.WECHAT ? "WX" : provider === PaymentProvider.ALIPAY ? "ALI" : "MOCK"),
      status: PaymentStatus.PENDING,
    },
    include: { order: true },
  });
}

export async function completePayment(merchantTradeNo: string, providerTradeNo: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.paymentAttempt.findUnique({
      where: { merchantTradeNo },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new StoreError("PAYMENT_NOT_FOUND", "支付记录不存在", 404);
    if (payment.status === PaymentStatus.SUCCEEDED) return payment.order;
    if (payment.order.status !== OrderStatus.PENDING_PAYMENT) throw new StoreError("ORDER_NOT_PAYABLE", "订单状态不可支付", 409);

    for (const item of payment.order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockOnHand: { decrement: item.quantity }, stockReserved: { decrement: item.quantity } },
      });
    }
    const now = new Date();
    await tx.paymentAttempt.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED, providerTradeNo, paidAt: now },
    });
    return tx.order.update({ where: { id: payment.order.id }, data: { status: OrderStatus.PAID, paidAt: now } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function expireOrders() {
  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING_PAYMENT, expiresAt: { lte: new Date() } },
    include: { items: true },
    take: 100,
  });
  for (const order of orders) {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.CANCELED, canceledAt: new Date() },
      });
      if (!changed.count) return;
      for (const item of order.items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockReserved: { decrement: item.quantity } } });
      }
      await tx.paymentAttempt.updateMany({ where: { orderId: order.id, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.CLOSED } });
    });
  }
  return orders.length;
}
