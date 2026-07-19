"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ children, className, redirectTo = "/" }: { children: React.ReactNode; className?: string; redirectTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button type="button" disabled={pending} className={className} onClick={async () => {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(redirectTo);
    router.refresh();
  }}>{pending ? "Chiqilmoqda..." : children}</button>;
}
