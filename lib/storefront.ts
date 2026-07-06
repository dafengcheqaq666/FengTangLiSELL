import { featuredProduct, type StorefrontProduct } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

function normalize(product: Awaited<ReturnType<typeof prisma.product.findFirst>> & { variants?: { id: string; sku: string; name: string; priceFen: number; weightGram: number }[] } | null): StorefrontProduct | null {
  if (!product?.variants?.length) return null;
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle ?? "产地直发",
    description: product.description,
    image: product.image,
    variants: product.variants.map((variant) => ({ ...variant, hint: `${variant.weightGram / 500}斤装` })),
  };
}

export async function loadFeaturedProduct(): Promise<StorefrontProduct | null> {
  try {
    const product = await prisma.product.findFirst({ where: { active: true, featured: true }, include: { variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } } });
    return normalize(product);
  } catch {
    return { ...featuredProduct, variants: [...featuredProduct.variants] };
  }
}

export async function loadProduct(slug: string): Promise<StorefrontProduct | null> {
  try {
    const product = await prisma.product.findFirst({ where: { slug, active: true }, include: { variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } } });
    return normalize(product);
  } catch {
    return slug === featuredProduct.slug ? { ...featuredProduct, variants: [...featuredProduct.variants] } : null;
  }
}
