"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeOrderNo } from "@/lib/money";

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
  if (!order || (order.status !== OrderStatus.PAID && order.status !== OrderStatus.FULFILLING)) throw new Error("当前订单不可退款");
  const payment = order.payments[0];
  if (!payment) throw new Error("找不到成功支付记录");
  if (payment.provider !== "MOCK") throw new Error("真实渠道退款需配置商户证书后通过支付平台执行；系统未伪造成功状态");
  const refundNo = makeOrderNo("RF");
  await prisma.$transaction(async (tx) => {
    await tx.refund.create({ data: { orderId, refundNo, amountFen: order.totalFen, reason, status: PaymentStatus.REFUNDED, providerRefundNo: `mock_${refundNo}` } });
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.REFUNDED } });
    await tx.paymentAttempt.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED } });
    for (const item of order.items) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: item.quantity } } });
  });
  await audit("order.refund", orderId, { reason, refundNo }); revalidatePath("/admin");
}
