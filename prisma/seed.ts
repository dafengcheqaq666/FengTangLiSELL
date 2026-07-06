import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { mainlandProvinces } from "../lib/provinces";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { slug: "guizhou-fengtang-plum" },
    update: {
      name: "仁寿吴家祠蜂糖李",
      subtitle: "单果精选 · 新鲜采摘 · 泡沫网兜护果包装",
      description: "高山昼夜温差，攒足阳光与甜。树上自然成熟，果肉细嫩离核。",
      image: "/images/fengtang-plum-hero.png",
      featured: true,
      active: true,
    },
    create: {
      id: "seed-product-plum",
      slug: "guizhou-fengtang-plum",
      name: "仁寿吴家祠蜂糖李",
      subtitle: "单果精选 · 新鲜采摘 · 泡沫网兜护果包装",
      description: "高山昼夜温差，攒足阳光与甜。树上自然成熟，果肉细嫩离核。",
      image: "/images/fengtang-plum-hero.png",
      featured: true,
      variants: {
        create: [
          { id: "seed-3jin", sku: "PLUM-3JIN", name: "3斤尝鲜装", priceFen: 5990, weightGram: 1500, stockOnHand: 100, sortOrder: 1 },
          { id: "seed-5jin", sku: "PLUM-5JIN", name: "5斤分享装", priceFen: 8990, weightGram: 2500, stockOnHand: 100, sortOrder: 2 },
          { id: "seed-10jin", sku: "PLUM-10JIN", name: "10斤礼享装", priceFen: 16800, weightGram: 5000, stockOnHand: 50, sortOrder: 3 },
        ],
      },
    },
  });
  for (const province of mainlandProvinces) {
    await prisma.shippingZone.upsert({ where: { province }, update: {}, create: { province, enabled: true, feeFen: 0 } });
  }
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "change-me-before-production";
  if (process.env.PAYMENT_MODE !== "mock" && password === "change-me-before-production") throw new Error("接入真实支付前必须设置安全的 ADMIN_PASSWORD");
  const passwordHash = await argon2.hash(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, active: true },
    create: { email, passwordHash },
  });
  console.info("Seed complete", { email, product: "guizhou-fengtang-plum" });
}

main().finally(() => prisma.$disconnect());
