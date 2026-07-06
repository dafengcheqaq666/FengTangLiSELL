import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "shanye_admin";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await prisma.adminSession.create({ data: { adminId, tokenHash: hashToken(token), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.admin.active) return null;
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(COOKIE_NAME);
}
