import { z } from "zod";

export const SESSION_COOKIE = "nexorapro_session";
export type UserRole = "admin" | "customer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const email = z.string().trim().email("Email manzil noto‘g‘ri").max(160).transform((value) => value.toLowerCase());
const password = z.string()
  .min(10, "Parol kamida 10 ta belgidan iborat bo‘lsin")
  .max(128)
  .regex(/[a-z]/, "Parolda kichik harf bo‘lishi kerak")
  .regex(/[A-Z]/, "Parolda katta harf bo‘lishi kerak")
  .regex(/\d/, "Parolda raqam bo‘lishi kerak")
  .regex(/[^A-Za-z0-9]/, "Parolda maxsus belgi bo‘lishi kerak");

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
});

export function safeNextPath(value: string | null | undefined, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
