import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  status = 429;
  constructor() { super("操作过于频繁，请稍后重试"); }
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function rateLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const windowMs = windowSeconds * 1000;
  const bucketStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const row = await prisma.requestLimit.upsert({
    where: { key_bucketStart: { key, bucketStart } },
    update: { count: { increment: 1 } },
    create: { key, bucketStart },
  });
  if (Math.random() < 0.02) void prisma.requestLimit.deleteMany({ where: { bucketStart: { lt: new Date(Date.now() - 86400_000) } } }).catch(() => undefined);
  if (row.count > limit) throw new RateLimitError();
}
