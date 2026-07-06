import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createPaymentAttempt, StoreError } from "@/lib/order-service";
import { getGateway, paymentProvider } from "@/lib/payments";
import { paymentSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  try {
    const input = paymentSchema.parse(await request.json());
    const provider = paymentProvider(input.provider);
    const channel = provider === "MOCK" ? "mock" : input.channel;
    const attempt = await createPaymentAttempt((await params).orderNo, provider, channel);
    const result = await getGateway(provider).create(attempt, { openId: input.openId });
    if (result.kind === "qrcode") return NextResponse.json({ kind: "qrcode", image: await QRCode.toDataURL(result.content, { width: 280, margin: 2 }) });
    return NextResponse.json(result);
  } catch (cause) {
    const status = cause instanceof StoreError ? cause.status : 400;
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "无法发起支付" }, { status });
  }
}
