import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function secret() {
  const value = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "development-secret-change-before-production-123");
  if (value.length < 32) throw new Error("SESSION_SECRET 必须至少 32 个字符");
  return new TextEncoder().encode(value);
}

function cookieName(orderNo: string) { return `order_${orderNo}`; }

export async function issueOrderAccess(orderNo: string, phone: string) {
  const token = await new SignJWT({ orderNo, phone }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  (await cookies()).set(cookieName(orderNo), token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: `/orders/${orderNo}`, maxAge: 30 * 86400 });
}

export async function canAccessOrder(orderNo: string) {
  const token = (await cookies()).get(cookieName(orderNo))?.value;
  if (!token) return false;
  try { const result = await jwtVerify(token, secret()); return result.payload.orderNo === orderNo; }
  catch { return false; }
}
