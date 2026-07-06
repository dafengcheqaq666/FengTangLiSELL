import type { PaymentGateway } from "./types";

export const mockGateway: PaymentGateway = {
  async create(attempt) {
    return { kind: "redirect", url: `/orders/${attempt.order.orderNo}?mockPayment=${attempt.merchantTradeNo}` };
  },
  async verifyNotification(payload) {
    return {
      merchantTradeNo: String(payload.merchantTradeNo),
      providerTradeNo: `mock_${Date.now()}`,
      amountFen: Number(payload.amountFen ?? 0),
      success: true,
    };
  },
  async close() {},
  async refund(_attempt, input) { return { status: "succeeded", providerRefundNo: `mock_${input.refundNo}` }; },
};
