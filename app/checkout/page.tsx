"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";
import { mainlandProvinces } from "@/lib/provinces";

export default function CheckoutPage() {
  const { lines, totalFen, clear } = useCart();
  const router = useRouter();
  const [provider, setProvider] = useState<"wechat" | "alipay">("wechat");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: lines.map(({ variantId, quantity }) => ({ variantId, quantity })), address: Object.fromEntries(data) }) });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error ?? "创建订单失败");
      const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      const wechat = /MicroMessenger/i.test(navigator.userAgent);
      const channel = provider === "wechat" ? (wechat ? "jsapi" : mobile ? "h5" : "native") : mobile ? "wap" : "page";
      const paymentResponse = await fetch(`/api/orders/${order.orderNo}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, channel }) });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.error ?? "发起支付失败");
      clear();
      if (payment.kind === "redirect") window.location.assign(payment.url);
      else if (payment.kind === "jsapi") {
        const bridge = (window as unknown as { WeixinJSBridge?: { invoke: (name: string, params: unknown, callback: () => void) => void } }).WeixinJSBridge;
        if (!bridge) throw new Error("请在微信内打开并完成公众号授权");
        bridge.invoke("getBrandWCPayRequest", payment.params, () => router.push(`/orders/${order.orderNo}`));
      } else router.push(`/orders/${order.orderNo}?qr=${encodeURIComponent(payment.image)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "结算失败"); setPending(false); }
  }

  return <><SiteHeader solid /><main className="page-shell"><div className="container"><h1>确认订单</h1>{!lines.length ? <div className="card empty">鲜果篮为空，请先选择商品。</div> : <form className="checkout-layout" onSubmit={submit}><div className="card"><h2>收货信息</h2><div className="form-grid"><div className="field"><label htmlFor="recipientName">收货人</label><input id="recipientName" name="recipientName" required minLength={2} /></div><div className="field"><label htmlFor="phone">手机号</label><input id="phone" name="phone" required inputMode="tel" pattern="1[0-9]{10}" /></div><div className="field"><label htmlFor="province">省份</label><select id="province" name="province" required defaultValue=""><option value="" disabled>请选择</option>{mainlandProvinces.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="city">城市</label><input id="city" name="city" required /></div><div className="field"><label htmlFor="district">区县</label><input id="district" name="district" required /></div><div className="field full-row"><label htmlFor="address">详细地址</label><input id="address" name="address" required minLength={5} /></div><div className="field full-row"><label htmlFor="customerNote">订单备注（选填）</label><textarea id="customerNote" name="customerNote" rows={3} /></div></div><h3>支付方式</h3><div className="payment-options"><button type="button" onClick={() => setProvider("wechat")} className={`payment-option${provider === "wechat" ? " active" : ""}`}>微信支付</button><button type="button" onClick={() => setProvider("alipay")} className={`payment-option${provider === "alipay" ? " active" : ""}`}>支付宝</button></div>{error && <p className="error" role="alert">{error}</p>}</div><aside className="card summary"><h3>商品清单</h3>{lines.map((line) => <div className="summary-row" key={line.variantId}><span>{line.variantName} × {line.quantity}</span><strong>{formatMoney(line.priceFen * line.quantity)}</strong></div>)}<div className="summary-row"><span>配送费</span><strong>包邮</strong></div><div className="summary-row summary-total"><span>应付</span><strong>{formatMoney(totalFen)}</strong></div><button className="primary-button full" disabled={pending}>{pending ? "正在创建订单…" : "提交并支付"}</button></aside></form>}</div></main></>;
}
