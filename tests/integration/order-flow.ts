import assert from "node:assert/strict";
import { OrderStatus, PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { completePayment, createOrder, createPaymentAttempt, expireOrders } from "@/lib/order-service";

async function main() {
 const createdOrderIds: string[] = [];
 const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: "seed-3jin" } });
 const input = {
   lines: [{ variantId: variant.id, quantity: 2 }],
   address: { recipientName: "集成测试", phone: "13800138000", province: "贵州省", city: "贵阳市", district: "南明区", address: "测试路 1 号" },
 };
 try {
  const order = await createOrder(input);
  createdOrderIds.push(order.id);
  const reserved = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(reserved.stockReserved, variant.stockReserved + 2, "creating an order must reserve stock");

  const payment = await createPaymentAttempt(order.orderNo, PaymentProvider.MOCK, "mock");
  const paid = await completePayment(payment.merchantTradeNo, "integration_mock", order.totalFen);
  assert.equal(paid.status, OrderStatus.PAID);
  const afterPayment = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(afterPayment.stockOnHand, variant.stockOnHand - 2, "payment must consume stock");
  assert.equal(afterPayment.stockReserved, variant.stockReserved, "payment must clear reservation");

  const expiring = await createOrder({ ...input, lines: [{ variantId: variant.id, quantity: 1 }] });
  createdOrderIds.push(expiring.id);
  await prisma.order.update({ where: { id: expiring.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.ok((await expireOrders()) >= 1);
  const expired = await prisma.order.findUniqueOrThrow({ where: { id: expiring.id } });
  assert.equal(expired.status, OrderStatus.CANCELED);
  const afterExpiry = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(afterExpiry.stockReserved, variant.stockReserved, "expiration must release reservation");

  console.info("Integration order flow passed");
 } finally {
   await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
   await prisma.productVariant.update({ where: { id: variant.id }, data: { stockOnHand: variant.stockOnHand, stockReserved: variant.stockReserved } });
   await prisma.$disconnect();
 }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
