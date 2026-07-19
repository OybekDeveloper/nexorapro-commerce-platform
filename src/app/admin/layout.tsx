import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requirePageUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Commerce Admin",
  description: "nexorapro.dev commerce management dashboard",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("admin", "/admin-login");
  return <AdminShell user={user}>{children}</AdminShell>;
}
