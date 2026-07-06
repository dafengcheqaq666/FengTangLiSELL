import { SignJWT, jwtVerify } from "jose";

function secret() {
  const value = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "development-secret-change-before-production-123");
  if (value.length < 32) throw new Error("SESSION_SECRET 必须至少 32 个字符");
  return new TextEncoder().encode(value);
}

export async function createWechatState(orderNo: string) {
  return new SignJWT({ orderNo, purpose: "wechat-oauth" }).setProtectedHeader({ alg: "HS256" }).setJti(crypto.randomUUID()).setIssuedAt().setExpirationTime("10m").sign(secret());
}

export async function verifyWechatState(token: string) {
  const result = await jwtVerify(token, secret());
  if (result.payload.purpose !== "wechat-oauth" || typeof result.payload.orderNo !== "string") throw new Error("无效的微信授权状态");
  return result.payload.orderNo;
}
