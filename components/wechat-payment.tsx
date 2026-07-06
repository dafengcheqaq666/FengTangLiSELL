"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bridge = { invoke: (name: string, params: Record<string, string>, callback: (result: { err_msg?: string }) => void) => void };

export function WechatPayment({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("正在唤起微信支付…");
  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${orderNo}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "wechat", channel: "jsapi" }) })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; })
      .then((result: { kind: string; params?: Record<string, string> }) => {
        if (!active || result.kind !== "jsapi" || !result.params) throw new Error("微信支付参数无效");
        const bridge = (window as unknown as { WeixinJSBridge?: Bridge }).WeixinJSBridge;
        if (!bridge) throw new Error("未检测到微信支付环境，请在微信内重新打开订单");
        bridge.invoke("getBrandWCPayRequest", result.params, () => { setMessage("正在确认支付结果…"); window.setTimeout(() => router.refresh(), 1200); });
      }).catch((error: unknown) => active && setMessage(error instanceof Error ? error.message : "微信支付失败"));
    return () => { active = false; };
  }, [orderNo, router]);
  return <p className="status-pill">{message}</p>;
}
