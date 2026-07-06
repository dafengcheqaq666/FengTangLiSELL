import { NextResponse } from "next/server";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try { await rateLimit("admin-login", clientIp(request), 5, 300); }
  catch { return NextResponse.json({ error: "登录尝试过多，请稍后重试" }, { status: 429 }); }
  const { email, password } = await request.json() as { email?: string; password?: string };
  const admin = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
  if (!admin?.active || !password || !(await argon2.verify(admin.passwordHash, password))) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }
  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true });
}
