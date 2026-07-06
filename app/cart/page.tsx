"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { useCart } from "@/components/cart-provider";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { lines, totalFen, update } = useCart();
  return <><SiteHeader solid /><main className="page-shell"><div className="container"><h1>鲜果篮</h1>{!lines.length ? <div className="card empty"><h2>篮子还是空的</h2><p className="muted">去挑一箱正当季的蜂糖李吧。</p><Link className="primary-button" href="/#shop">返回选购</Link></div> : <div className="cart-layout"><div className="cart-list">{lines.map((line) => <article className="card cart-item" key={line.variantId}><div className="cart-thumb"><Image src={line.image} alt={line.productName} fill sizes="120px" /></div><div><h3>{line.productName}</h3><div className="muted">{line.variantName}</div><strong>{formatMoney(line.priceFen)}</strong></div><div className="quantity"><button onClick={() => update(line.variantId, line.quantity - 1)} aria-label="减少数量">−</button><output>{line.quantity}</output><button onClick={() => update(line.variantId, line.quantity + 1)} aria-label="增加数量">＋</button></div></article>)}</div><aside className="card summary"><h3>订单小计</h3><div className="summary-row"><span>商品金额</span><strong>{formatMoney(totalFen)}</strong></div><div className="summary-row"><span>配送</span><span>结算时确认</span></div><div className="summary-row summary-total"><span>合计</span><strong>{formatMoney(totalFen)}</strong></div><Link className="primary-button full" href="/checkout">填写收货信息</Link></aside></div>}</div></main></>;
}
