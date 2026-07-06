import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createPaymentAttempt, StoreError } from "@/lib/order-service";
import { getGateway, paymentProvider } from "@/lib/payments";
import { paymentSchema } from "@/lib/validation";
import { canAccessOrder } from "@/lib/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  try {
    const orderNo = (await params).orderNo;
    if (!(await canAccessOrder(orderNo))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await rateLimit("payment", clientIp(request), 12, 60);
    const input = paymentSchema.parse(await request.json());
    const provider = paymentProvider(input.provider);
    if (provider === "WECHAT" && !["jsapi", "h5", "native"].includes(input.channel)) throw new Error("微信支付渠道无效");
    if (provider === "ALIPAY" && !["wap", "page"].includes(input.channel)) throw new Error("支付宝渠道无效");
    const channel = provider === "MOCK" ? "mock" : input.channel;
    const openId = input.openId ?? (await cookies()).get("wechat_openid")?.value;
    if (provider === "WECHAT" && channel === "jsapi" && !openId) return NextResponse.json({ kind: "oauth", url: `/api/payments/wechat/oauth?orderNo=${encodeURIComponent(orderNo)}` });
    const attempt = await createPaymentAttempt(orderNo, provider, channel);
    let result;
    try {
      result = await getGateway(provider).create(attempt, { openId, clientIp: clientIp(request) });
    } catch (cause) {
      await prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.FAILED } });
      throw cause;
    }
    if (result.kind === "qrcode") return NextResponse.json({ kind: "qrcode", image: await QRCode.toDataURL(result.content, { width: 280, margin: 2 }) });
    return NextResponse.json(result);
  } catch (cause) {
    const status = cause instanceof StoreError ? cause.status : 400;
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "无法发起支付" }, { status });
  }
}
