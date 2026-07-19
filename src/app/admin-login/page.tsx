import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { NexoraMark } from "@/components/icons/nexora-icons";
import { getOptionalUser } from "@/server/auth";

export const metadata: Metadata = { title: "Admin kirish", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const user = await getOptionalUser();
  if (user?.role === "admin") redirect("/admin");
  return <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 py-12 text-[#1d1d1f]"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,161,132,0.35),transparent_45%)]" /><section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#f7f7f8] p-6 shadow-2xl sm:p-9"><span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand text-white"><NexoraMark className="size-8" /></span><p className="mt-6 text-sm font-semibold text-brand">Secure commerce workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Admin panelga kirish.</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Mahsulot, ombor, sotuv va analitika faqat admin rolidagi akkauntga ochiladi.</p><AuthForm admin next="/admin" /></section></main>;
}
