INSERT INTO "Product" (
  "id", "slug", "name", "subtitle", "description", "image", "featured", "active", "updatedAt"
) VALUES (
  'seed-product-plum',
  'guizhou-fengtang-plum',
  '仁寿吴家祠蜂糖李',
  '单果精选 · 新鲜采摘 · 泡沫网兜护果包装',
  '高山昼夜温差，给足阳光与甜。树上自然成熟，果肉细嫩离核。',
  '/images/fengtang-plum-hero.png',
  true,
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "subtitle" = EXCLUDED."subtitle",
  "description" = EXCLUDED."description",
  "image" = EXCLUDED."image",
  "featured" = EXCLUDED."featured",
  "active" = EXCLUDED."active",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ProductVariant" (
  "id", "productId", "sku", "name", "priceFen", "weightGram", "stockOnHand", "stockReserved", "active", "sortOrder", "updatedAt"
) VALUES
  ('seed-3jin', 'seed-product-plum', 'PLUM-3JIN', '3斤尝鲜装', 5990, 1500, 100, 0, true, 1, CURRENT_TIMESTAMP),
  ('seed-5jin', 'seed-product-plum', 'PLUM-5JIN', '5斤分享装', 8990, 2500, 100, 0, true, 2, CURRENT_TIMESTAMP),
  ('seed-10jin', 'seed-product-plum', 'PLUM-10JIN', '10斤礼享装', 16800, 5000, 50, 0, true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("sku") DO UPDATE SET
  "productId" = EXCLUDED."productId",
  "name" = EXCLUDED."name",
  "priceFen" = EXCLUDED."priceFen",
  "weightGram" = EXCLUDED."weightGram",
  "stockOnHand" = EXCLUDED."stockOnHand",
  "active" = EXCLUDED."active",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ShippingZone" ("id", "province", "enabled", "feeFen", "updatedAt") VALUES
  ('zone-beijing', '北京市', true, 0, CURRENT_TIMESTAMP),
  ('zone-tianjin', '天津市', true, 0, CURRENT_TIMESTAMP),
  ('zone-hebei', '河北省', true, 0, CURRENT_TIMESTAMP),
  ('zone-shanxi', '山西省', true, 0, CURRENT_TIMESTAMP),
  ('zone-neimenggu', '内蒙古自治区', true, 0, CURRENT_TIMESTAMP),
  ('zone-liaoning', '辽宁省', true, 0, CURRENT_TIMESTAMP),
  ('zone-jilin', '吉林省', true, 0, CURRENT_TIMESTAMP),
  ('zone-heilongjiang', '黑龙江省', true, 0, CURRENT_TIMESTAMP),
  ('zone-shanghai', '上海市', true, 0, CURRENT_TIMESTAMP),
  ('zone-jiangsu', '江苏省', true, 0, CURRENT_TIMESTAMP),
  ('zone-zhejiang', '浙江省', true, 0, CURRENT_TIMESTAMP),
  ('zone-anhui', '安徽省', true, 0, CURRENT_TIMESTAMP),
  ('zone-fujian', '福建省', true, 0, CURRENT_TIMESTAMP),
  ('zone-jiangxi', '江西省', true, 0, CURRENT_TIMESTAMP),
  ('zone-shandong', '山东省', true, 0, CURRENT_TIMESTAMP),
  ('zone-henan', '河南省', true, 0, CURRENT_TIMESTAMP),
  ('zone-hubei', '湖北省', true, 0, CURRENT_TIMESTAMP),
  ('zone-hunan', '湖南省', true, 0, CURRENT_TIMESTAMP),
  ('zone-guangdong', '广东省', true, 0, CURRENT_TIMESTAMP),
  ('zone-guangxi', '广西壮族自治区', true, 0, CURRENT_TIMESTAMP),
  ('zone-hainan', '海南省', true, 0, CURRENT_TIMESTAMP),
  ('zone-chongqing', '重庆市', true, 0, CURRENT_TIMESTAMP),
  ('zone-sichuan', '四川省', true, 0, CURRENT_TIMESTAMP),
  ('zone-guizhou', '贵州省', true, 0, CURRENT_TIMESTAMP),
  ('zone-yunnan', '云南省', true, 0, CURRENT_TIMESTAMP),
  ('zone-xizang', '西藏自治区', true, 0, CURRENT_TIMESTAMP),
  ('zone-shaanxi', '陕西省', true, 0, CURRENT_TIMESTAMP),
  ('zone-gansu', '甘肃省', true, 0, CURRENT_TIMESTAMP),
  ('zone-qinghai', '青海省', true, 0, CURRENT_TIMESTAMP),
  ('zone-ningxia', '宁夏回族自治区', true, 0, CURRENT_TIMESTAMP),
  ('zone-xinjiang', '新疆维吾尔自治区', true, 0, CURRENT_TIMESTAMP)
ON CONFLICT ("province") DO UPDATE SET
  "enabled" = EXCLUDED."enabled",
  "feeFen" = EXCLUDED."feeFen",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "AdminUser" (
  "id", "email", "passwordHash", "active", "updatedAt"
) VALUES (
  'seed-admin',
  'admin@example.com',
  '$argon2id$v=19$m=65536,t=3,p=4$GjpEKmpyE0b6giGegPGxGg$J0QZyjcHJ+4+uft23YgPX0NHXhX5YDT1F1iDuExNZ20',
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "active" = EXCLUDED."active",
  "updatedAt" = CURRENT_TIMESTAMP;
