import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE, type AuthUser, type UserRole } from "@/lib/auth";
import { getUserBySession } from "@/server/auth-repository";
import { HttpError } from "@/server/http";

async function readUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserBySession(token) : null;
}

export const getOptionalUser = cache(readUser);

export async function requireApiUser(role?: UserRole) {
  const user = await readUser();
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi");
  if (role && user.role !== role) throw new HttpError(403, "Bu amal uchun ruxsat yo‘q");
  return user;
}

export async function requirePageUser(role?: UserRole, loginPath = "/login") {
  const user = await getOptionalUser();
  if (!user) redirect(loginPath);
  if (role && user.role !== role) redirect(role === "admin" ? "/admin-login" : "/");
  return user;
}

export async function setSessionCookie(token: string, expires: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
    priority: "high",
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
