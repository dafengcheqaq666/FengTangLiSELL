import type { PaymentAttempt, Order } from "@prisma/client";

export type PaymentWithOrder = PaymentAttempt & { order: Order };

export type PaymentResult =
  | { kind: "redirect"; url: string }
  | { kind: "qrcode"; content: string }
  | { kind: "jsapi"; params: Record<string, string> };

export interface PaymentGateway {
  create(attempt: PaymentWithOrder, options?: { openId?: string }): Promise<PaymentResult>;
  verifyNotification(payload: Record<string, string>, headers?: Headers): Promise<{ merchantTradeNo: string; providerTradeNo: string; success: boolean }>;
}
