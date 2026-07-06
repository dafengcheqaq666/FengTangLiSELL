import { NextResponse } from "next/server";
import { wechatGateway } from "@/lib/payments/wechat";
import { completePayment } from "@/lib/order-service";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const result = await wechatGateway.verifyNotification({ __raw: raw }, request.headers);
    if (result.success) await completePayment(result.merchantTradeNo, result.providerTradeNo);
    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  } catch { return NextResponse.json({ code: "FAIL", message: "失败" }, { status: 400 }); }
}
