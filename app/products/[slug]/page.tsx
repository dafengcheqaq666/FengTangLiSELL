import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ProductSelector } from "@/components/product-selector";
import { loadProduct } from "@/lib/storefront";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await loadProduct((await params).slug);
  if (!product) notFound();
  return <><SiteHeader solid /><main className="page-shell"><div className="container"><div className="shop-wrap"><div className="product-visual"><Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 100vw, 50vw" /></div><ProductSelector product={product} /></div></div></main></>;
}
