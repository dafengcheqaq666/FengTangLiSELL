import { Prisma, OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { makeOrderNo } from "@/lib/money";
import type { z } from "zod";
import type { createOrderSchema } from "@/lib/validation";
import { getGateway } from "@/lib/payments";

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
  const existing = await prisma.paymentAttempt.findFirst({
    where: { orderId: order.id, provider, channel, status: PaymentStatus.PENDING },
    orderBy: { createdAt: "desc" },
    include: { order: true },
  });
  if (existing) return existing;
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

export async function completePayment(merchantTradeNo: string, providerTradeNo: string, amountFen?: number) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.paymentAttempt.findUnique({
      where: { merchantTradeNo },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new StoreError("PAYMENT_NOT_FOUND", "支付记录不存在", 404);
    if (payment.status === PaymentStatus.SUCCEEDED || payment.status === PaymentStatus.REFUNDING || payment.status === PaymentStatus.REFUNDED) return payment.order;
    if (amountFen !== undefined && amountFen !== payment.amountFen) throw new StoreError("PAYMENT_AMOUNT_MISMATCH", "支付金额不匹配", 409);
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
    include: { items: true, payments: { where: { status: PaymentStatus.PENDING } } },
    take: 100,
  });
  let released = 0;
  for (const order of orders) {
    try {
      for (const payment of order.payments) await getGateway(payment.provider).close({ ...payment, order });
    } catch {
      continue;
    }
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
    released += 1;
  }
  return released;
}

export async function completeRefund(refundNo: string, providerRefundNo: string) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { refundNo }, include: { order: { include: { items: true } } } });
    if (!refund) throw new StoreError("REFUND_NOT_FOUND", "退款记录不存在", 404);
    if (refund.status === PaymentStatus.REFUNDED) return refund.order;
    if (refund.status !== PaymentStatus.REFUNDING) throw new StoreError("REFUND_NOT_PENDING", "退款状态不可更新", 409);
    for (const item of refund.order.items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: item.quantity } } });
    }
    await tx.refund.update({ where: { id: refund.id }, data: { status: PaymentStatus.REFUNDED, providerRefundNo } });
    await tx.paymentAttempt.updateMany({ where: { orderId: refund.orderId, status: { in: [PaymentStatus.SUCCEEDED, PaymentStatus.REFUNDING] } }, data: { status: PaymentStatus.REFUNDED } });
    return tx.order.update({ where: { id: refund.orderId }, data: { status: OrderStatus.REFUNDED } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function failRefund(refundNo: string) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { refundNo } });
    if (!refund || refund.status !== PaymentStatus.REFUNDING) return;
    await tx.refund.update({ where: { id: refund.id }, data: { status: PaymentStatus.FAILED } });
    await tx.order.update({ where: { id: refund.orderId }, data: { status: OrderStatus.PAID } });
    await tx.paymentAttempt.updateMany({ where: { orderId: refund.orderId, status: PaymentStatus.REFUNDING }, data: { status: PaymentStatus.SUCCEEDED } });
  });
}
