import { describe, expect, it } from "vitest";
import { resolvePaymentChannel } from "@/lib/payment-channel";

describe("resolvePaymentChannel", () => {
  it("uses JSAPI inside WeChat", () => expect(resolvePaymentChannel("wechat", "iPhone MicroMessenger")).toBe("jsapi"));
  it("uses H5 in a regular mobile browser", () => expect(resolvePaymentChannel("wechat", "Android Chrome")).toBe("h5"));
  it("uses Native on desktop", () => expect(resolvePaymentChannel("wechat", "Windows Chrome")).toBe("native"));
  it("selects Alipay WAP and page by device", () => {
    expect(resolvePaymentChannel("alipay", "iPhone Safari")).toBe("wap");
    expect(resolvePaymentChannel("alipay", "Macintosh Safari")).toBe("page");
  });
});
