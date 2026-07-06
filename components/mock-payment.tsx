"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function MockPayment({ merchantTradeNo }: { merchantTradeNo: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("开发模式：正在模拟支付回调…");
  useEffect(() => {
    fetch("/api/payments/mock/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchantTradeNo }) })
      .then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); setMessage("模拟支付成功"); router.refresh(); })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "模拟支付失败"));
  }, [merchantTradeNo, router]);
  return <p className="status-pill">{message}</p>;
}
