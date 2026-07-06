import { describe, expect, it } from "vitest";
import { createOrderSchema, paymentSchema } from "@/lib/validation";

const address = { recipientName: "李小果", phone: "13800138000", province: "贵州省", city: "贵阳市", district: "南明区", address: "花果园路 1 号" };

describe("checkout validation", () => {
  it("accepts a valid order", () => {
    expect(createOrderSchema.safeParse({ lines: [{ variantId: "v1", quantity: 2 }], address }).success).toBe(true);
  });
  it("rejects invalid phone and quantity", () => {
    expect(createOrderSchema.safeParse({ lines: [{ variantId: "v1", quantity: 10 }], address: { ...address, phone: "123" } }).success).toBe(false);
  });
  it("only accepts known payment channels", () => {
    expect(paymentSchema.safeParse({ provider: "wechat", channel: "jsapi" }).success).toBe(true);
    expect(paymentSchema.safeParse({ provider: "wechat", channel: "cash" }).success).toBe(false);
  });
});
