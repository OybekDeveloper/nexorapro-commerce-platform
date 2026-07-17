import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
