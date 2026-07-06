import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupSchema } from "@/lib/validation";
import { issueOrderAccess } from "@/lib/order-access";
import { clientIp, rateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await rateLimit("order-lookup", clientIp(request), 8, 300);
    const input = lookupSchema.parse(await request.json());
    const order = await prisma.order.findFirst({ where: { orderNo: input.orderNo, phone: input.phone }, select: { orderNo: true } });
    if (!order) return NextResponse.json({ error: "订单号或手机号不匹配" }, { status: 404 });
    await issueOrderAccess(order.orderNo, input.phone);
    return NextResponse.json({ url: `/orders/${order.orderNo}` });
  } catch (cause) {
    if (cause instanceof RateLimitError) return NextResponse.json({ error: cause.message }, { status: 429 });
    return NextResponse.json({ error: "请输入有效的订单号和手机号" }, { status: 400 });
  }
}
