"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { setError((await response.json()).error); setPending(false); return; }
    router.replace("/admin"); router.refresh();
  }
  return <main className="page-shell"><div className="container"><div className="card login-card"><Link href="/">← 返回商城</Link><h1>管理后台</h1><form className="form-grid" onSubmit={submit}><div className="field full-row"><label htmlFor="email">管理员邮箱</label><input id="email" name="email" type="email" required /></div><div className="field full-row"><label htmlFor="password">密码</label><input id="password" name="password" type="password" required /></div>{error && <p className="error">{error}</p>}<button className="primary-button full-row" disabled={pending}>{pending ? "登录中…" : "登录"}</button></form></div></div></main>;
}
