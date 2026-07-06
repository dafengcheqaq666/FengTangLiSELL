import { describe, expect, it } from "vitest";
import { OrderStatus } from "@prisma/client";
import { canRefund, canShip } from "@/lib/order-policy";

describe("order policy", () => {
  it("only ships paid, unshipped orders", () => {
    expect(canShip(OrderStatus.PAID)).toBe(true);
    expect(canShip(OrderStatus.SHIPPED)).toBe(false);
  });
  it("does not refund pending or shipped orders online", () => {
    expect(canRefund(OrderStatus.PENDING_PAYMENT)).toBe(false);
    expect(canRefund(OrderStatus.FULFILLING)).toBe(true);
    expect(canRefund(OrderStatus.SHIPPED)).toBe(false);
  });
});
