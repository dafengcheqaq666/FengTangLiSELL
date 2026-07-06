import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const order = await prisma.order.findUnique({ where: { orderNo: (await params).orderNo }, select: { status: true, paidAt: true } });
  return order ? NextResponse.json(order) : NextResponse.json({ error: "订单不存在" }, { status: 404 });
}
