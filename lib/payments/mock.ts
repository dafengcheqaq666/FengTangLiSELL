import type { PaymentGateway } from "./types";

export const mockGateway: PaymentGateway = {
  async create(attempt) {
    return { kind: "redirect", url: `/orders/${attempt.order.orderNo}?mockPayment=${attempt.merchantTradeNo}` };
  },
  async verifyNotification(payload) {
    return {
      merchantTradeNo: String(payload.merchantTradeNo),
      providerTradeNo: `mock_${Date.now()}`,
      success: true,
    };
  },
};
