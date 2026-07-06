import { NextResponse } from "next/server";
import { verifyWechatRefundNotification } from "@/lib/payments/wechat";
import { completeRefund, failRefund } from "@/lib/order-service";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const result = verifyWechatRefundNotification({ __raw: raw }, request.headers);
    if (result.success) await completeRefund(result.refundNo, result.providerRefundNo);
    else await failRefund(result.refundNo);
    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  } catch {
    return NextResponse.json({ code: "FAIL", message: "失败" }, { status: 400 });
  }
}
