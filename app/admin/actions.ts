"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeOrderNo } from "@/lib/money";
import { getGateway } from "@/lib/payments";
import { completeRefund } from "@/lib/order-service";
import { canRefund, canShip } from "@/lib/order-policy";

async function audit(action: string, target: string, detail?: Record<string, unknown>) {
  const admin = await requireAdmin();
  await prisma.auditLog.create({ data: { adminId: admin.id, action, target, detail: detail as Prisma.InputJsonValue | undefined } });
}

export async function updateVariant(formData: FormData) {
  const id = String(formData.get("id"));
  const priceFen = Math.round(Number(formData.get("price")) * 100);
  const stockOnHand = Number(formData.get("stock"));
  if (!Number.isInteger(priceFen) || priceFen < 1 || !Number.isInteger(stockOnHand) || stockOnHand < 0) throw new Error("价格或库存无效");
  await requireAdmin();
  await prisma.productVariant.update({ where: { id }, data: { priceFen, stockOnHand } });
  await audit("variant.update", id, { priceFen, stockOnHand }); revalidatePath("/admin"); revalidatePath("/");
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!name) throw new Error("商品名称不能为空");
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { name, subtitle, active } });
  await audit("product.update", id, { name, subtitle, active }); revalidatePath("/admin"); revalidatePath("/");
}

export async function updateZone(formData: FormData) {
  const id = String(formData.get("id"));
  const enabled = formData.get("enabled") === "on";
  const feeFen = Math.max(0, Math.round(Number(formData.get("fee")) * 100));
  await requireAdmin();
  await prisma.shippingZone.update({ where: { id }, data: { enabled, feeFen } });
  await audit("shipping-zone.update", id, { enabled, feeFen }); revalidatePath("/admin");
}

export async function shipOrder(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const carrier = String(formData.get("carrier") ?? "").trim();
  const trackingNo = String(formData.get("trackingNo") ?? "").trim();
  if (!carrier || !trackingNo) throw new Error("请填写承运商和运单号");
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order || !canShip(order.status)) throw new Error("当前订单不可发货");
  await prisma.$transaction([
    prisma.shipment.upsert({ where: { orderId }, update: { carrier, trackingNo, shippedAt: new Date() }, create: { orderId, carrier, trackingNo } }),
    prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.SHIPPED } }),
  ]);
  await audit("order.ship", orderId, { carrier, trackingNo }); revalidatePath("/admin");
}

export async function refundOrder(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const reason = String(formData.get("reason") || "管理员整单退款");
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: { where: { status: PaymentStatus.SUCCEEDED }, take: 1 } } });
  if (!order || !canRefund(order.status)) throw new Error("当前订单不可退款");
  const payment = order.payments[0];
  if (!payment) throw new Error("找不到成功支付记录");
  const refundNo = makeOrderNo("RF");
  await prisma.$transaction([
    prisma.refund.create({ data: { orderId, refundNo, amountFen: order.totalFen, reason, status: PaymentStatus.REFUNDING } }),
    prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.REFUNDING } }),
    prisma.paymentAttempt.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDING } }),
  ]);
  try {
    const result = await getGateway(payment.provider).refund({ ...payment, order }, { refundNo, amountFen: order.totalFen, reason });
    if (result.status === "succeeded") await completeRefund(refundNo, result.providerRefundNo ?? refundNo);
    else if (result.providerRefundNo) await prisma.refund.update({ where: { refundNo }, data: { providerRefundNo: result.providerRefundNo } });
  } catch (cause) {
    await prisma.$transaction([
      prisma.refund.update({ where: { refundNo }, data: { status: PaymentStatus.FAILED } }),
      prisma.order.update({ where: { id: orderId }, data: { status: order.status } }),
      prisma.paymentAttempt.update({ where: { id: payment.id }, data: { status: PaymentStatus.SUCCEEDED } }),
    ]);
    throw cause;
  }
  await audit("order.refund", orderId, { reason, refundNo }); revalidatePath("/admin");
}
