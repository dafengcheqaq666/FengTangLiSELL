"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function Brand() {
  return <Link className="brand" href="/#top" aria-label="山野蜜境首页"><span className="brand-mark" aria-hidden="true" /><span>山野蜜境</span></Link>;
}

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const { count } = useCart();
  return (
    <header className={`site-header${solid ? " solid" : ""}`}>
      <nav className="nav container" aria-label="主导航">
        <Brand />
        <div className="nav-links">
          <Link href="/#news">每日新闻</Link><Link href="/#taste">风味</Link><Link href="/#origin">产地</Link><Link href="/#fresh">鲜达</Link>
          <Link className="nav-buy" href="/cart">鲜果篮{count ? ` · ${count}` : ""}</Link>
        </div>
        <Link className="nav-mobile-buy" href="/cart">鲜果篮{count ? ` · ${count}` : ""}</Link>
      </nav>
    </header>
  );
}
