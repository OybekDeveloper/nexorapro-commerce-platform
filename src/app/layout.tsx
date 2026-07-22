import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import { StoreProvider } from "@/components/storefront/store-provider";
import { StorefrontMotionShell } from "@/components/storefront/storefront-motion-shell";
import { getCachedStorefrontProducts } from "@/server/cached-commerce";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "nexorapro.uz — Premium technology store",
    template: "%s | nexorapro.uz",
  },
  applicationName: "nexorapro.uz",
  description: "nexorapro.uz premium electronics storefront and commerce management platform.",
  icons: {
    icon: "/nexorapro-dev-icon.svg",
    shortcut: "/nexorapro-dev-icon.svg",
    apple: "/nexorapro-dev-icon.svg",
  },
  openGraph: {
    title: "nexorapro.uz — Premium technology store",
    description: "Premium electronics storefront and commerce management platform.",
    siteName: "nexorapro.uz",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await getCachedStorefrontProducts();
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <StoreProvider initialProducts={products}>
          <StorefrontMotionShell>{children}</StorefrontMotionShell>
        </StoreProvider>
      </body>
    </html>
  );
}
