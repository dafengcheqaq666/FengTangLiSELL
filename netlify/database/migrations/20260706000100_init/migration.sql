CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'FULFILLING', 'SHIPPED', 'COMPLETED', 'CANCELED', 'REFUNDING', 'REFUNDED');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CLOSED', 'REFUNDING', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'WECHAT', 'ALIPAY');

CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "subtitle" TEXT,
  "description" TEXT NOT NULL, "image" TEXT NOT NULL, "featured" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "sku" TEXT NOT NULL, "name" TEXT NOT NULL,
  "priceFen" INTEGER NOT NULL, "weightGram" INTEGER NOT NULL, "stockOnHand" INTEGER NOT NULL DEFAULT 0,
  "stockReserved" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Order" (
  "id" TEXT NOT NULL, "orderNo" TEXT NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "subtotalFen" INTEGER NOT NULL, "shippingFen" INTEGER NOT NULL DEFAULT 0, "totalFen" INTEGER NOT NULL,
  "recipientName" TEXT NOT NULL, "phone" TEXT NOT NULL, "province" TEXT NOT NULL, "city" TEXT NOT NULL,
  "district" TEXT NOT NULL, "address" TEXT NOT NULL, "customerNote" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3), "canceledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "variantId" TEXT NOT NULL, "productName" TEXT NOT NULL,
  "variantName" TEXT NOT NULL, "sku" TEXT NOT NULL, "unitPriceFen" INTEGER NOT NULL, "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PaymentAttempt" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED', "merchantTradeNo" TEXT NOT NULL,
  "providerTradeNo" TEXT, "amountFen" INTEGER NOT NULL, "channel" TEXT NOT NULL, "response" JSONB,
  "paidAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Refund" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "refundNo" TEXT NOT NULL, "amountFen" INTEGER NOT NULL,
  "reason" TEXT NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'REFUNDING', "providerRefundNo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "carrier" TEXT NOT NULL, "trackingNo" TEXT NOT NULL,
  "shippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ShippingZone" (
  "id" TEXT NOT NULL, "province" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "feeFen" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "adminId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "adminId" TEXT, "action" TEXT NOT NULL, "target" TEXT NOT NULL, "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RequestLimit" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "bucketStart" TIMESTAMP(3) NOT NULL, "count" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RequestLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_active_idx" ON "ProductVariant"("productId", "active");
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");
CREATE INDEX "Order_phone_createdAt_idx" ON "Order"("phone", "createdAt");
CREATE UNIQUE INDEX "PaymentAttempt_merchantTradeNo_key" ON "PaymentAttempt"("merchantTradeNo");
CREATE INDEX "PaymentAttempt_orderId_status_idx" ON "PaymentAttempt"("orderId", "status");
CREATE UNIQUE INDEX "Refund_orderId_key" ON "Refund"("orderId");
CREATE UNIQUE INDEX "Refund_refundNo_key" ON "Refund"("refundNo");
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");
CREATE UNIQUE INDEX "ShippingZone_province_key" ON "ShippingZone"("province");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_adminId_expiresAt_idx" ON "AdminSession"("adminId", "expiresAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "RequestLimit_bucketStart_idx" ON "RequestLimit"("bucketStart");
CREATE UNIQUE INDEX "RequestLimit_key_bucketStart_key" ON "RequestLimit"("key", "bucketStart");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
