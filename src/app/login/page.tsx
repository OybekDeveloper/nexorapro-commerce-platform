import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { NexoraMark } from "@/components/icons/nexora-icons";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { safeNextPath } from "@/lib/auth";
import { getOptionalUser } from "@/server/auth";

export const metadata: Metadata = { title: "Kirish", description: "nexorapro.uz mijoz akkaunti" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const [user, query] = await Promise.all([getOptionalUser(), searchParams]);
  const next = safeNextPath(query.next, "/account");
  if (user) redirect(next);
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><StoreHeader /><main id="main-content" className="px-4 py-14 sm:px-6 sm:py-20"><section className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.07)] sm:p-9"><span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><NexoraMark className="size-8" /></span><p className="mt-6 text-sm font-semibold text-brand">nexorapro.uz account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Xush kelibsiz.</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Email orqali kiring, checkout qiling va buyurtmalaringizni bir joyda kuzating.</p><AuthForm next={next} initialMode={query.mode === "register" ? "register" : "login"} /></section></main><StoreFooter /></div>;
}
