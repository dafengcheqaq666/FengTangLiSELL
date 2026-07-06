"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrderStatusPoller({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  useEffect(() => {
    let checks = 0;
    const timer = window.setInterval(async () => {
      checks += 1;
      const response = await fetch(`/api/orders/${orderNo}/status`, { cache: "no-store" });
      if (response.ok) {
        const result = await response.json() as { status: string };
        if (result.status !== "PENDING_PAYMENT") { window.clearInterval(timer); router.refresh(); }
      }
      if (checks >= 60) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [orderNo, router]);
  return null;
}
