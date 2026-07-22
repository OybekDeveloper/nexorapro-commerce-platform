"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import type { AuthUser } from "@/lib/auth";

export function AuthForm({ admin = false, next = "/", initialMode = "login" }: { admin?: boolean; next?: string; initialMode?: "login" | "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(admin && process.env.NODE_ENV === "development" ? "admin@nexorapro.uz" : "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = admin ? "/api/auth/admin/login" : mode === "register" ? "/api/auth/register" : "/api/auth/login";

  return <form className="mt-8 space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" && !admin ? { name, email, password } : { email, password }),
      });
      const payload = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok) throw new Error(payload.error || "Kirish amalga oshmadi");
      router.replace(admin ? "/admin" : next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kirish amalga oshmadi");
      setPending(false);
    }
  }}>
    {!admin && mode === "register" && <label className="block"><span className="text-sm font-medium">Ism</span><span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:ring-2 focus-within:ring-brand"><UserRound className="size-4 text-zinc-400" /><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Oybek Developer" /></span></label>}
    <label className="block"><span className="text-sm font-medium">Email</span><span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:ring-2 focus-within:ring-brand"><Mail className="size-4 text-zinc-400" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={admin ? "admin@nexorapro.uz" : "siz@email.com"} /></span></label>
    <label className="block"><span className="text-sm font-medium">Parol</span><span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:ring-2 focus-within:ring-brand"><LockKeyhole className="size-4 text-zinc-400" /><input required type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="••••••••••" /></span>{mode === "register" && <span className="mt-2 block text-xs leading-5 text-zinc-500">Kamida 10 belgi: katta-kichik harf, raqam va maxsus belgi.</span>}</label>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={pending} className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,161,132,0.22)] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Tekshirilmoqda..." : admin ? "Admin panelga kirish" : mode === "login" ? "Kirish" : "Akkaunt yaratish"}<ArrowRight className="size-4" /></button>
    {!admin && <button type="button" onClick={() => { setMode((value) => value === "login" ? "register" : "login"); setError(null); }} className="w-full cursor-pointer text-center text-sm font-medium text-zinc-600 hover:text-brand">{mode === "login" ? "Akkauntingiz yo‘qmi? Ro‘yxatdan o‘ting" : "Akkauntingiz bormi? Kirish"}</button>}
    {admin && <Link href="/" className="block text-center text-sm font-medium text-zinc-500 hover:text-brand">Do‘konga qaytish</Link>}
  </form>;
}
