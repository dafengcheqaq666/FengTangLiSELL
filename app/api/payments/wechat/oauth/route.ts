import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canAccessOrder } from "@/lib/order-access";
import { createWechatState, verifyWechatState } from "@/lib/wechat-oauth";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少微信配置：${name}`);
  return value;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (code && state) {
      const orderNo = await verifyWechatState(state);
      const tokenResponse = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(required("WECHAT_APP_ID"))}&secret=${encodeURIComponent(required("WECHAT_APP_SECRET"))}&code=${encodeURIComponent(code)}&grant_type=authorization_code`, { cache: "no-store" });
      const token = await tokenResponse.json() as { openid?: string; errcode?: number; errmsg?: string };
      if (!tokenResponse.ok || !token.openid) throw new Error(`微信授权失败：${token.errmsg ?? token.errcode ?? tokenResponse.status}`);
      (await cookies()).set("wechat_openid", token.openid, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
      return NextResponse.redirect(new URL(`/orders/${orderNo}?resumeWechat=1`, process.env.APP_URL ?? url.origin));
    }

    const orderNo = url.searchParams.get("orderNo") ?? "";
    if (!orderNo || !(await canAccessOrder(orderNo))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const callback = `${process.env.APP_URL ?? url.origin}/api/payments/wechat/oauth`;
    const oauthState = await createWechatState(orderNo);
    const target = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(required("WECHAT_APP_ID"))}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&scope=snsapi_base&state=${encodeURIComponent(oauthState)}#wechat_redirect`;
    return NextResponse.redirect(target);
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "微信授权失败" }, { status: 400 });
  }
}
