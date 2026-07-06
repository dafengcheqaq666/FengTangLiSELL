import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const provinces = ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省", "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省", "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区"];

async function main() {
  await prisma.product.upsert({
    where: { slug: "guizhou-fengtang-plum" },
    update: {},
    create: {
      id: "seed-product-plum",
      slug: "guizhou-fengtang-plum",
      name: "贵州蜂糖李",
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
  for (const province of provinces) {
    await prisma.shippingZone.upsert({ where: { province }, update: {}, create: { province, enabled: true, feeFen: 0 } });
  }
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "change-me-before-production";
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await argon2.hash(password) },
  });
  console.info("Seed complete", { email, product: "guizhou-fengtang-plum" });
}

main().finally(() => prisma.$disconnect());
