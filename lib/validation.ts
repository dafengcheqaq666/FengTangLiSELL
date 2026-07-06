import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(9),
});

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(30),
  phone: z.string().regex(/^1\d{10}$/, "请输入有效的大陆手机号"),
  province: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(30),
  district: z.string().trim().min(1).max(30),
  address: z.string().trim().min(5).max(120),
  customerNote: z.string().trim().max(200).optional(),
});

export const createOrderSchema = z.object({
  lines: z.array(cartLineSchema).min(1).max(20),
  address: addressSchema,
});

export const paymentSchema = z.object({
  provider: z.enum(["mock", "wechat", "alipay"]),
  channel: z.enum(["mock", "jsapi", "h5", "native", "wap", "page"]),
  openId: z.string().optional(),
});

export const lookupSchema = z.object({
  orderNo: z.string().trim().min(12).max(40),
  phone: z.string().regex(/^1\d{10}$/),
});
