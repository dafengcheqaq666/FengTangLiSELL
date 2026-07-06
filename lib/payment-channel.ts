export type CheckoutProvider = "wechat" | "alipay";
export type CheckoutChannel = "jsapi" | "h5" | "native" | "wap" | "page";

export function resolvePaymentChannel(provider: CheckoutProvider, userAgent: string): CheckoutChannel {
  const mobile = /Android|iPhone|iPad/i.test(userAgent);
  const wechat = /MicroMessenger/i.test(userAgent);
  if (provider === "wechat") return wechat ? "jsapi" : mobile ? "h5" : "native";
  return mobile ? "wap" : "page";
}
