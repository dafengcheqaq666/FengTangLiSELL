import { describe, expect, it } from "vitest";
import { formatMoney, makeOrderNo } from "@/lib/money";

describe("money and order numbers", () => {
  it("formats integer fen as CNY", () => expect(formatMoney(5990)).toContain("59.9"));
  it("creates provider-safe unique-looking order numbers", () => {
    const value = makeOrderNo("WX");
    expect(value).toMatch(/^WX\d{8}[A-F0-9]{12}$/);
    expect(value.length).toBeLessThanOrEqual(32);
  });
});
