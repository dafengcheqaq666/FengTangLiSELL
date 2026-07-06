import { NextResponse } from "next/server";
import { createOrder, StoreError } from "@/lib/order-service";
import { createOrderSchema } from "@/lib/validation";
import { issueOrderAccess } from "@/lib/order-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = createOrderSchema.parse(await request.json());
    const order = await createOrder(input);
    await issueOrderAccess(order.orderNo, input.address.phone);
    return NextResponse.json({ orderNo: order.orderNo, totalFen: order.totalFen, expiresAt: order.expiresAt });
  } catch (cause) {
    if (cause instanceof StoreError) return NextResponse.json({ error: cause.message, code: cause.code }, { status: cause.status });
    return NextResponse.json({ error: "订单信息无效" }, { status: 400 });
  }
}
