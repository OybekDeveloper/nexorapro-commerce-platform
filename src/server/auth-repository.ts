import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { compareSync, hashSync } from "bcryptjs";

import type { AuthUser, UserRole } from "@/lib/auth";
import { database } from "@/server/database";

type UserRow = AuthUser & { password_hash: string };
type AttemptRow = { failures: number; locked_until: string | null };

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function createCustomer(name: string, email: string, password: string): AuthUser {
  const id = `usr_${randomUUID().slice(0, 12)}`;
  const cleanEmail = normalizeEmail(email);
  database.prepare(`
    INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'customer')
  `).run(id, name.trim(), cleanEmail, hashSync(password, 12));
  return { id, name: name.trim(), email: cleanEmail, role: "customer" };
}

export function customerEmailExists(email: string) {
  const cleanEmail = normalizeEmail(email);
  const row = database.prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1").get(cleanEmail);
  return Boolean(row);
}

export function authenticateUser(email: string, password: string, requiredRole?: UserRole): AuthUser | null {
  const cleanEmail = normalizeEmail(email);
  const row = database.prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ?").get(cleanEmail) as UserRow | undefined;
  if (!row || (requiredRole && row.role !== requiredRole) || !compareSync(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function getLoginLock(email: string) {
  const row = database.prepare("SELECT failures, locked_until FROM login_attempts WHERE email = ?").get(normalizeEmail(email)) as AttemptRow | undefined;
  if (!row?.locked_until) return null;
  const lockedUntil = new Date(row.locked_until);
  if (lockedUntil.getTime() <= Date.now()) {
    database.prepare("DELETE FROM login_attempts WHERE email = ?").run(normalizeEmail(email));
    return null;
  }
  return lockedUntil;
}

export function recordLoginFailure(email: string) {
  const cleanEmail = normalizeEmail(email);
  const current = database.prepare("SELECT failures FROM login_attempts WHERE email = ?").get(cleanEmail) as { failures: number } | undefined;
  const failures = (current?.failures ?? 0) + 1;
  const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
  database.prepare(`
    INSERT INTO login_attempts (email, failures, locked_until, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET failures = excluded.failures, locked_until = excluded.locked_until, updated_at = CURRENT_TIMESTAMP
  `).run(cleanEmail, failures, lockedUntil);
  return lockedUntil;
}

export function clearLoginFailures(email: string) {
  database.prepare("DELETE FROM login_attempts WHERE email = ?").run(normalizeEmail(email));
}

export function createSession(userId: string, metadata: { userAgent?: string | null; ipAddress?: string | null } = {}) {
  const token = randomBytes(32).toString("base64url");
  const days = Math.max(1, Number(process.env.SESSION_TTL_DAYS) || 7);
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  database.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  database.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)
  `).run(hashToken(token), userId, expiresAt.toISOString(), metadata.userAgent ?? null, metadata.ipAddress ?? null);
  return { token, expiresAt };
}

// Runs on every authenticated request; prepare once instead of per call.
const selectUserBySession = database.prepare(`
  SELECT u.id, u.name, u.email, u.role
  FROM sessions s JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ? AND s.expires_at > ?
`);

export function getUserBySession(token: string): AuthUser | null {
  const row = selectUserBySession.get(hashToken(token), new Date().toISOString()) as AuthUser | undefined;
  return row ?? null;
}

export function deleteSession(token: string) {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
