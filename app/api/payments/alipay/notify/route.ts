import { NextResponse } from "next/server";
import { alipayGateway } from "@/lib/payments/alipay";
import { completePayment } from "@/lib/order-service";

export async function POST(request: Request) {
  try {
    const form = Object.fromEntries(await request.formData()) as Record<string, string>;
    const result = await alipayGateway.verifyNotification(form);
    if (result.success) await completePayment(result.merchantTradeNo, result.providerTradeNo, result.amountFen);
    return new NextResponse("success");
  } catch { return new NextResponse("failure", { status: 400 }); }
}
