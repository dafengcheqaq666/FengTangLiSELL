export const featuredProduct = {
  slug: "guizhou-fengtang-plum",
  name: "贵州蜂糖李",
  subtitle: "单果精选 · 新鲜采摘 · 泡沫网兜护果包装",
  description: "高山昼夜温差，攒足阳光与甜。树上自然成熟，果肉细嫩离核。",
  image: "/images/fengtang-plum-hero.png",
  variants: [
    { id: "seed-3jin", sku: "PLUM-3JIN", name: "3斤尝鲜装", priceFen: 5990, hint: "约 ¥20/斤" },
    { id: "seed-5jin", sku: "PLUM-5JIN", name: "5斤分享装", priceFen: 8990, hint: "约 ¥18/斤" },
    { id: "seed-10jin", sku: "PLUM-10JIN", name: "10斤礼享装", priceFen: 16800, hint: "约 ¥17/斤" },
  ],
} as const;

export type CatalogVariant = (typeof featuredProduct.variants)[number];
