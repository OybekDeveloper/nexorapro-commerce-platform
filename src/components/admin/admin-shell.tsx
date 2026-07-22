"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings,
  X,
} from "lucide-react";

import { NexoraIcon, NexoraMark, type NexoraIconName } from "@/components/icons/nexora-icons";
import { ProductStoreProvider } from "@/components/admin/product-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

const navigation: Array<{ label: string; href: string; icon: NexoraIconName }> = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Mahsulotlar", href: "/admin/products", icon: "product" },
  { label: "Sotuv", href: "/admin/sales", icon: "sale" },
  { label: "Ombor va kirim", href: "/admin/inventory", icon: "inventory" },
  { label: "Buyurtmalar", href: "/admin/orders", icon: "order" },
  { label: "Analitika", href: "/admin/analytics", icon: "analytics" },
  { label: "Tarjimalar", href: "/admin/localization", icon: "language" },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const sidebar = (
    <aside className={cn("flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200", collapsed ? "w-[76px]" : "w-[260px]")}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/admin" className="flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand"><NexoraMark className="size-7" /></span>
          {!collapsed && <span className="whitespace-nowrap text-lg font-semibold tracking-[-0.04em]">nexorapro<span className="text-brand">.uz</span> admin</span>}
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl hover:bg-sidebar-accent lg:hidden" aria-label="Menyuni yopish">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigatsiyasi">
        {navigation.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-brand text-white shadow-[0_8px_24px_rgba(16,161,132,0.2)]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <NexoraIcon name={item.icon} className="size-[19px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        <Link href="/" className="flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <NexoraIcon name="store" className="size-[19px] shrink-0" />
          {!collapsed && <><span className="flex-1">Do‘konni ko‘rish</span><ChevronRight className="size-4" /></>}
        </Link>
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex">
          <PanelLeftClose className={cn("size-[18px] shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Panelni yig‘ish</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <ProductStoreProvider>
    <div className="min-h-screen bg-muted/35">
      <a href="#admin-content" className="sr-only z-[60] rounded-lg bg-foreground px-4 py-2 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Kontentga o‘tish</a>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Menyuni yopish" className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[min(86vw,300px)]">{sidebar}</div>
        </div>
      )}

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]")}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden" aria-label="Menyuni ochish">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-xs font-medium text-muted-foreground">nexorapro.uz Commerce</p>
              <p className="text-sm font-semibold">Asosiy do‘kon</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">Storefront <ExternalLink className="size-3.5" /></Link>
            <ThemeToggle />
            <div className="relative"><button type="button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Bildirishnomalar" aria-expanded={notificationsOpen}><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-background" /></button>{notificationsOpen && <div className="absolute right-0 top-12 z-20 w-[min(86vw,340px)] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"><div className="border-b border-border p-4"><p className="font-semibold">Bildirishnomalar</p><p className="mt-1 text-xs text-muted-foreground">3 ta yangi operational signal</p></div><div className="divide-y divide-border">{[["Kam qoldiq", "MacBook Pro 14 — 3 dona qoldi"], ["Yangi buyurtma", "#NX-1062 checkout orqali yaratildi"], ["Tarjima", "2 ta mahsulotda EN kontent yetishmaydi"]].map(([title, text]) => <div key={title} className="p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></div>}</div>
            <div className="relative"><button type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={profileOpen}><span className="flex size-6 items-center justify-center rounded-lg bg-brand text-[10px] font-bold text-white">{user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="hidden sm:inline">{user.name}</span></button>{profileOpen && <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl"><div className="px-3 py-2"><p className="text-sm font-semibold">{user.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p></div><div className="my-1 h-px bg-border" /><button type="button" className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-muted"><Settings className="size-4" />Sozlamalar</button><LogoutButton className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium text-red-600 hover:bg-red-500/10" redirectTo="/admin-login"><LogOut className="size-4" />Chiqish</LogoutButton></div>}</div>
          </div>
        </header>
        <main id="admin-content" className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
    </ProductStoreProvider>
  );
}
