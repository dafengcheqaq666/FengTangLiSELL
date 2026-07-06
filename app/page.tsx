import Image from "next/image";
import Link from "next/link";
import { SiteHeader, Brand } from "@/components/site-header";
import { ProductSelector } from "@/components/product-selector";
import { RevealObserver } from "@/components/reveal";
import { loadFeaturedProduct } from "@/lib/storefront";

const image = "/images/fengtang-plum-hero.png";

export default async function HomePage() {
  const product = await loadFeaturedProduct();
  return <>
    <SiteHeader />
    <main id="top">
      <section className="hero">
        <div className="hero-image"><Image src={image} alt="清晨果园里的新鲜蜂糖李" fill priority sizes="100vw" /></div>
        <div className="container"><div className="hero-content"><div className="eyebrow">贵州山地 · 当季鲜果</div><h1>蜂糖李<span className="hero-title-small">一口清脆，满口蜜甜</span></h1><p className="hero-desc">高山昼夜温差，攒足阳光与甜。树上自然成熟，果肉细嫩离核，咬开是清甜汁水，也是贵州盛夏最鲜活的味道。</p><div className="hero-actions"><Link className="btn-primary" href="#shop"><span>抢鲜下单</span><span>→</span></Link><div className="price-note">当季尝鲜价<br /><strong>¥59.9</strong> 起</div></div></div></div>
        <div className="harvest-tag"><div><strong>24h</strong>采后快速发出</div></div>
      </section>
      <div className="ticker" aria-hidden="true"><div className="ticker-track">{[...Array(2)].flatMap((_, i) => ["树上熟 · 自然甜", "现摘现发 · 坏果包赔", "脆甜多汁 · 细嫩离核", "贵州山地 · 当季限定"].map((text) => <span className="ticker-item" key={`${i}-${text}`}>{text}</span>))}</div></div>
      <section className="features" id="taste"><div className="container"><div className="section-head reveal"><div><div className="section-kicker">WHY FENGTANG PLUM</div><h2>好李子，甜得有层次</h2></div><p className="section-intro">不是单调的糖甜。先是清脆果香，随后蜜意渐浓，最后留下一点恰到好处的微酸，越吃越清爽。</p></div><div className="feature-grid">
        <article className="feature-card reveal"><span className="feature-number">01</span><div className="feature-icon">◒</div><h3>薄皮 · 一咬即破</h3><p>果皮细薄，轻轻一咬便迸出丰沛汁水，入口不涩，清新果香自然散开。</p></article>
        <article className="feature-card reveal"><span className="feature-number">02</span><div className="feature-icon">✦</div><h3>蜜甜 · 清润不腻</h3><p>成熟果甜度充足，甜里带着淡淡果酸，像山泉兑进一勺蜂蜜，耐吃又解暑。</p></article>
        <article className="feature-card reveal"><span className="feature-number">03</span><div className="feature-icon">◎</div><h3>离核 · 果肉饱满</h3><p>果肉细嫩紧实，成熟后轻松离核，吃起来干净利落，每一口都是完整满足。</p></article>
      </div></div></section>
      <section className="origin" id="origin"><div className="container origin-grid"><div className="origin-photo reveal"><Image src={image} alt="贵州山地蜂糖李果园" fill sizes="(max-width: 900px) 100vw, 50vw" /></div><div className="origin-copy reveal"><div className="section-kicker">FROM THE MOUNTAINS</div><h2>山高、雾润，<br />才养得出这口甜</h2><p>蜂糖李喜欢阳光，也爱山里的清凉。贵州山地充足日照与昼夜温差，让果实白天积攒糖分，夜晚缓慢沉淀风味。雨雾滋润、自然生长，等果香成熟再采摘。</p><div className="data-row"><div className="data-item"><strong>26°N</strong><span>黄金种植纬度</span></div><div className="data-item"><strong>12h</strong><span>显著昼夜温差</span></div><div className="data-item"><strong>1果1剪</strong><span>人工轻采护果</span></div></div></div></div></section>
      <section className="shop" id="shop"><div className="container"><div className="section-head reveal"><div><div className="section-kicker">SEASONAL OFFER</div><h2>当季鲜甜，限量装箱</h2></div><p className="section-intro">蜂糖李赏味期短，每日按成熟度分批采摘。现在下单，把盛夏最新鲜的一口带回家。</p></div><div className="shop-wrap reveal"><div className="product-visual"><Image src={product?.image ?? image} alt={product?.name ?? "贵州蜂糖李"} fill sizes="(max-width: 900px) 100vw, 50vw" /><span className="product-badge">{product ? "本季热卖" : "暂时售罄"}</span></div>{product ? <ProductSelector product={product} /> : <div className="product-panel"><h2>本季已售罄</h2><p className="product-sub">感谢惦记。下一批成熟时，我们再把山里的清甜装箱送来。</p></div>}</div></div></section>
      <section className="process" id="fresh"><div className="container"><div className="section-head reveal"><div><div className="section-kicker">FRESH JOURNEY</div><h2>从枝头到舌尖，<br />鲜甜不绕路</h2></div><p className="section-intro">成熟一批，采摘一批。减少中间周转，让每一颗蜂糖李都带着果园里的鲜活气息到家。</p></div><div className="steps">{[["01","测熟采摘","清晨按果色与成熟度人工轻采"],["02","人工分选","剔除瑕疵果，按规格细致挑选"],["03","防震装箱","独立网套保护，减少运输磕碰"],["04","快速鲜达","产地直发，全程物流可追踪"]].map(([n,t,p]) => <div className="step reveal" key={n}><div className="step-num">{n}</div><h3>{t}</h3><p>{p}</p></div>)}</div></div></section>
      <section className="quote"><div className="container reveal"><div className="quote-mark">“</div><blockquote>咔嚓一声，是清脆；<br />汁水涌出，是盛夏的甜。</blockquote><div className="taste-tags">{["脆嫩","清甜","多汁","离核","果香浓"].map((tag) => <span key={tag}>{tag}</span>)}</div></div></section>
      <section className="final-cta"><div className="container"><div className="cta-card reveal"><div className="cta-copy"><div className="section-kicker">LIMITED HARVEST</div><h2>错过这一季，<br />又要再等一年</h2><p>自然成熟不催熟，产量随天气与成熟度而定。趁果香正盛，把贵州山里的蜜甜带回家。</p><Link className="btn-primary" href="#shop"><span>立即选购</span><span>↑</span></Link></div></div></div></section>
    </main>
    <footer><div className="container footer-inner"><Brand /><div className="footer-note">自然生长 · 用心挑选 · 产地直达<br />贵州山地鲜果商城</div></div></footer>
    <RevealObserver />
  </>;
}
