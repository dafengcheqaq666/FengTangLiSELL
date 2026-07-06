import { NextResponse } from "next/server";
import { completePayment } from "@/lib/order-service";

export async function POST(request: Request) {
  if (process.env.PAYMENT_MODE !== "mock") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { merchantTradeNo } = await request.json() as { merchantTradeNo: string };
  try {
    const order = await completePayment(merchantTradeNo, `mock_${Date.now()}`);
    return NextResponse.json({ orderNo: order.orderNo, status: order.status });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Mock 支付失败" }, { status: 400 });
  }
}
