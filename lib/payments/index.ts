import { PaymentProvider } from "@prisma/client";
import { alipayGateway } from "./alipay";
import { mockGateway } from "./mock";
import { wechatGateway } from "./wechat";

export function paymentProvider(input: string) {
  if (process.env.PAYMENT_MODE === "mock") return PaymentProvider.MOCK;
  if (input === "wechat") return PaymentProvider.WECHAT;
  if (input === "alipay") return PaymentProvider.ALIPAY;
  throw new Error("生产环境不允许 Mock 支付");
}

export function getGateway(provider: PaymentProvider) {
  if (provider === PaymentProvider.MOCK) return mockGateway;
  if (provider === PaymentProvider.WECHAT) return wechatGateway;
  return alipayGateway;
}
