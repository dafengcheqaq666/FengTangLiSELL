import type { PaymentAttempt, Order } from "@prisma/client";

export type PaymentWithOrder = PaymentAttempt & { order: Order };

export type PaymentResult =
  | { kind: "redirect"; url: string }
  | { kind: "qrcode"; content: string }
  | { kind: "jsapi"; params: Record<string, string> };

export type RefundResult = { status: "pending" | "succeeded"; providerRefundNo?: string };

export interface PaymentGateway {
  create(attempt: PaymentWithOrder, options?: { openId?: string; clientIp?: string }): Promise<PaymentResult>;
  verifyNotification(payload: Record<string, string>, headers?: Headers): Promise<{ merchantTradeNo: string; providerTradeNo: string; amountFen: number; success: boolean }>;
  close(attempt: PaymentWithOrder): Promise<void>;
  refund(attempt: PaymentWithOrder, input: { refundNo: string; amountFen: number; reason: string }): Promise<RefundResult>;
}
