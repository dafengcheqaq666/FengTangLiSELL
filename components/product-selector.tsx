"use client";

import { useState } from "react";
import Link from "next/link";
import { featuredProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function ProductSelector() {
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const variant = featuredProduct.variants[selected];

  function addToCart() {
    add({ variantId: variant.id, productName: featuredProduct.name, variantName: variant.name, priceFen: variant.priceFen, image: featuredProduct.image, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="product-panel">
      <div className="rating">★★★★★ <span>当季鲜果推荐</span></div>
      <h2>{featuredProduct.name}</h2>
      <p className="product-sub">{featuredProduct.subtitle}<br />收到后常温回甜 1–2 天，风味更佳。</p>
      <div className="price"><strong>{formatMoney(variant.priceFen)}</strong><small>/ {variant.name}</small></div>
      <div className="option-label"><strong>选择规格</strong><span>家庭分享更划算</span></div>
      <div className="pack-options" role="radiogroup" aria-label="商品规格">
        {featuredProduct.variants.map((item, index) => (
          <button key={item.id} className={`pack${selected === index ? " active" : ""}`} onClick={() => setSelected(index)} role="radio" aria-checked={selected === index}>
            {item.name.replace(/尝鲜装|分享装|礼享装/, "装")}<small>{item.hint}</small>
          </button>
        ))}
      </div>
      <div className="buy-row">
        <div className="quantity" aria-label="购买数量"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="减少数量">−</button><output>{quantity}</output><button onClick={() => setQuantity(Math.min(9, quantity + 1))} aria-label="增加数量">＋</button></div>
        <button className="buy-btn" onClick={addToCart}>加入鲜果篮 · {formatMoney(variant.priceFen * quantity)}</button>
      </div>
      <div className="promise"><span>顺丰 / 京东冷链</span><span>坏果凭图赔付</span><span>产地直发</span></div>
      {added && <div className="toast show" role="status">已加入鲜果篮 · <Link href="/cart">去结算 →</Link></div>}
    </div>
  );
}
