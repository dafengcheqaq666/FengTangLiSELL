import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessOrder } from "@/lib/order-access";

export async function GET(_: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const orderNo = (await params).orderNo;
  if (!(await canAccessOrder(orderNo))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const order = await prisma.order.findUnique({ where: { orderNo }, select: { status: true, paidAt: true } });
  return order ? NextResponse.json(order) : NextResponse.json({ error: "订单不存在" }, { status: 404 });
}
