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

function formatDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;
}

function signedParams(method: string, bizContent: Record<string, unknown>, extra: Record<string, string> = {}) {
  const params: Record<string, string> = {
    app_id: env("ALIPAY_APP_ID"), method, format: "JSON", charset: "utf-8", sign_type: "RSA2",
    timestamp: formatDate(), version: "1.0", biz_content: JSON.stringify(bizContent), ...extra,
  };
  const signer = createSign("RSA-SHA256");
  signer.update(canonical(params), "utf8");
  params.sign = signer.sign(env("ALIPAY_PRIVATE_KEY"), "base64");
  return params;
}

async function callAlipay(method: string, bizContent: Record<string, unknown>) {
  const response = await fetch(process.env.ALIPAY_GATEWAY ?? "https://openapi.alipay.com/gateway.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(signedParams(method, bizContent)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`支付宝请求失败：HTTP ${response.status}`);
  const json = await response.json() as Record<string, Record<string, string>>;
  const key = `${method.replaceAll(".", "_")}_response`;
  const result = json[key];
  if (!result || result.code !== "10000") throw new Error(`支付宝请求失败：${result?.sub_msg ?? result?.msg ?? "未知错误"}`);
  return result;
}

export const alipayGateway: PaymentGateway = {
  async create(attempt) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const method = attempt.channel === "page" ? "alipay.trade.page.pay" : "alipay.trade.wap.pay";
    const params = signedParams(method, {
      out_trade_no: attempt.merchantTradeNo,
      total_amount: (attempt.amountFen / 100).toFixed(2),
      subject: `山野蜜境订单 ${attempt.order.orderNo}`,
      product_code: method.endsWith("page.pay") ? "FAST_INSTANT_TRADE_PAY" : "QUICK_WAP_WAY",
      time_expire: formatDate(attempt.order.expiresAt),
    }, {
      notify_url: `${appUrl}/api/payments/alipay/notify`,
      return_url: `${appUrl}/orders/${attempt.order.orderNo}`,
    });
    const query = new URLSearchParams(params).toString();
    return { kind: "redirect", url: `${process.env.ALIPAY_GATEWAY ?? "https://openapi.alipay.com/gateway.do"}?${query}` };
  },
  async verifyNotification(payload) {
    const signature = payload.sign;
    const signed = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "sign" && key !== "sign_type"));
    const verifier = createVerify("RSA-SHA256");
    verifier.update(canonical(signed), "utf8");
    if (!signature || !verifier.verify(env("ALIPAY_PUBLIC_KEY"), signature, "base64")) throw new Error("支付宝回调验签失败");
    if (payload.app_id !== env("ALIPAY_APP_ID")) throw new Error("支付宝回调应用不匹配");
    return {
      merchantTradeNo: payload.out_trade_no,
      providerTradeNo: payload.trade_no,
      amountFen: Math.round(Number(payload.total_amount) * 100),
      success: payload.trade_status === "TRADE_SUCCESS" || payload.trade_status === "TRADE_FINISHED",
    };
  },
  async close(attempt) {
    await callAlipay("alipay.trade.close", { out_trade_no: attempt.merchantTradeNo });
  },
  async refund(attempt, input) {
    const result = await callAlipay("alipay.trade.refund", {
      out_trade_no: attempt.merchantTradeNo,
      out_request_no: input.refundNo,
      refund_amount: (input.amountFen / 100).toFixed(2),
      refund_reason: input.reason,
    });
    return { status: "succeeded", providerRefundNo: result.trade_no };
  },
};
