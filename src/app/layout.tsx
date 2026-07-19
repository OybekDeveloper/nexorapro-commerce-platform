import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { StoreProvider } from "@/components/storefront/store-provider";
import { StorefrontMotionShell } from "@/components/storefront/storefront-motion-shell";
import { getOptionalUser } from "@/server/auth";
import { getCachedStorefrontProducts } from "@/server/cached-commerce";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "nexorapro.dev — Premium technology store",
    template: "%s | nexorapro.dev",
  },
  applicationName: "nexorapro.dev",
  description: "nexorapro.dev premium electronics storefront and commerce management platform.",
  icons: {
    icon: "/nexorapro-dev-icon.svg",
    shortcut: "/nexorapro-dev-icon.svg",
    apple: "/nexorapro-dev-icon.svg",
  },
  openGraph: {
    title: "nexorapro.dev — Premium technology store",
    description: "Premium electronics storefront and commerce management platform.",
    siteName: "nexorapro.dev",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, user] = await Promise.all([getCachedStorefrontProducts(), getOptionalUser()]);
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <StoreProvider initialProducts={products} initialUser={user}>
          <StorefrontMotionShell>{children}</StorefrontMotionShell>
        </StoreProvider>
      </body>
    </html>
  );
}
