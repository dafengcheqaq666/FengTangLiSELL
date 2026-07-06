import { createSign, createVerify } from "node:crypto";
import type { PaymentGateway } from "./types";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少支付宝配置：${name}`);
  return value.replaceAll("\\n", "\n");
}

function canonical(params: Record<string, string>) {
  return Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
}

export const alipayGateway: PaymentGateway = {
  async create(attempt) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const method = attempt.channel === "page" ? "alipay.trade.page.pay" : "alipay.trade.wap.pay";
    const params: Record<string, string> = {
      app_id: env("ALIPAY_APP_ID"),
      method,
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" }),
      version: "1.0",
      notify_url: `${appUrl}/api/payments/alipay/notify`,
      return_url: `${appUrl}/orders/${attempt.order.orderNo}`,
      biz_content: JSON.stringify({
        out_trade_no: attempt.merchantTradeNo,
        total_amount: (attempt.amountFen / 100).toFixed(2),
        subject: `山野蜜境订单 ${attempt.order.orderNo}`,
        product_code: method.endsWith("page.pay") ? "FAST_INSTANT_TRADE_PAY" : "QUICK_WAP_WAY",
        time_expire: attempt.order.expiresAt.toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" }),
      }),
    };
    const signer = createSign("RSA-SHA256");
    signer.update(canonical(params), "utf8");
    params.sign = signer.sign(env("ALIPAY_PRIVATE_KEY"), "base64");
    const query = new URLSearchParams(params).toString();
    return { kind: "redirect", url: `https://openapi.alipay.com/gateway.do?${query}` };
  },
  async verifyNotification(payload) {
    const signature = payload.sign;
    const signed = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "sign" && key !== "sign_type"));
    const verifier = createVerify("RSA-SHA256");
    verifier.update(canonical(signed), "utf8");
    if (!signature || !verifier.verify(env("ALIPAY_PUBLIC_KEY"), signature, "base64")) throw new Error("支付宝回调验签失败");
    return {
      merchantTradeNo: payload.out_trade_no,
      providerTradeNo: payload.trade_no,
      success: payload.trade_status === "TRADE_SUCCESS" || payload.trade_status === "TRADE_FINISHED",
    };
  },
};
