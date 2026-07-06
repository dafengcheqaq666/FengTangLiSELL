import { createDecipheriv, createSign, createVerify, randomBytes } from "node:crypto";
import type { PaymentGateway, PaymentResult, PaymentWithOrder } from "./types";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少微信支付配置：${name}`);
  return value.replaceAll("\\n", "\n");
}

function nonce() {
  return randomBytes(16).toString("hex");
}

function rsaSign(message: string) {
  const signer = createSign("RSA-SHA256");
  signer.update(message);
  return signer.sign(env("WECHAT_PRIVATE_KEY"), "base64");
}

async function wechatRequest<T>(path: string, body: unknown): Promise<T> {
  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = nonce();
  const bodyText = JSON.stringify(body);
  const signature = rsaSign(`${method}\n${path}\n${timestamp}\n${nonceStr}\n${bodyText}\n`);
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${env("WECHAT_MCH_ID")}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${env("WECHAT_MCH_SERIAL_NO")}",signature="${signature}"`;
  const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method,
    headers: { Authorization: authorization, Accept: "application/json", "Content-Type": "application/json" },
    body: bodyText,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`微信支付请求失败：${response.status} ${await response.text()}`);
  return response.json() as Promise<T>;
}

async function createPayment(attempt: PaymentWithOrder, openId?: string): Promise<PaymentResult> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const channel = attempt.channel;
  const path = `/v3/pay/transactions/${channel}`;
  const common = {
    appid: env("WECHAT_APP_ID"),
    mchid: env("WECHAT_MCH_ID"),
    description: `山野蜜境订单 ${attempt.order.orderNo}`,
    out_trade_no: attempt.merchantTradeNo,
    time_expire: attempt.order.expiresAt.toISOString(),
    notify_url: `${appUrl}/api/payments/wechat/notify`,
    amount: { total: attempt.amountFen, currency: "CNY" },
  };
  if (channel === "jsapi") {
    if (!openId) throw new Error("微信 JSAPI 支付缺少 openid");
    const result = await wechatRequest<{ prepay_id: string }>(path, { ...common, payer: { openid: openId } });
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = nonce();
    const pkg = `prepay_id=${result.prepay_id}`;
    return { kind: "jsapi", params: { appId: env("WECHAT_APP_ID"), timeStamp, nonceStr, package: pkg, signType: "RSA", paySign: rsaSign(`${env("WECHAT_APP_ID")}\n${timeStamp}\n${nonceStr}\n${pkg}\n`) } };
  }
  if (channel === "h5") {
    const result = await wechatRequest<{ h5_url: string }>(path, {
      ...common,
      scene_info: { payer_client_ip: "127.0.0.1", h5_info: { type: "Wap", app_name: "山野蜜境", app_url: appUrl } },
    });
    return { kind: "redirect", url: result.h5_url };
  }
  const result = await wechatRequest<{ code_url: string }>(path, common);
  return { kind: "qrcode", content: result.code_url };
}

function decryptResource(resource: Record<string, string>) {
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(env("WECHAT_API_V3_KEY")), Buffer.from(resource.nonce));
  decipher.setAAD(Buffer.from(resource.associated_data ?? ""));
  const ciphertext = Buffer.from(resource.ciphertext, "base64");
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  return JSON.parse(Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]).toString("utf8")) as Record<string, unknown>;
}

export const wechatGateway: PaymentGateway = {
  create: (attempt, options) => createPayment(attempt, options?.openId),
  async verifyNotification(payload, headers) {
    const raw = payload.__raw ?? JSON.stringify(payload);
    const timestamp = headers?.get("Wechatpay-Timestamp") ?? "";
    const nonceStr = headers?.get("Wechatpay-Nonce") ?? "";
    const signature = headers?.get("Wechatpay-Signature") ?? "";
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${timestamp}\n${nonceStr}\n${raw}\n`);
    if (!verifier.verify(env("WECHAT_PLATFORM_CERT"), signature, "base64")) throw new Error("微信支付回调验签失败");
    const parsed = JSON.parse(raw) as { resource: Record<string, string> };
    const transaction = decryptResource(parsed.resource);
    return {
      merchantTradeNo: String(transaction.out_trade_no),
      providerTradeNo: String(transaction.transaction_id),
      success: transaction.trade_state === "SUCCESS",
    };
  },
};
