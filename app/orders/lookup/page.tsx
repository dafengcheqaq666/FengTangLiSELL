"use client";

import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site-header";

export default function LookupPage() {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) return setError(result.error);
    window.location.assign(result.url);
  }
  return <><SiteHeader solid /><main className="page-shell"><div className="container"><div className="card login-card"><h1>查询订单</h1><p className="muted">使用下单时的订单号与收货手机号查询。</p><form className="form-grid" onSubmit={submit}><div className="field full-row"><label htmlFor="orderNo">订单号</label><input id="orderNo" name="orderNo" required /></div><div className="field full-row"><label htmlFor="phone">收货手机号</label><input id="phone" name="phone" required pattern="1[0-9]{10}" /></div>{error && <p className="error">{error}</p>}<button className="primary-button full-row">查询</button></form></div></div></main></>;
}
