import { NextResponse } from "next/server";
import { expireOrders } from "@/lib/order-service";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ expired: await expireOrders() });
}
