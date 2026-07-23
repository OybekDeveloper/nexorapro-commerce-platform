"use client";

import dynamic from "next/dynamic";

// Recharts is the heaviest client library on the dashboard. Loading it after
// hydration keeps the initial admin chunk small; fixed-height placeholders
// match the chart containers so nothing shifts when the charts arrive.
function ChartFallback({ height }: { height: number }) {
  return <div style={{ height }} className="w-full animate-pulse rounded-xl bg-muted/50" aria-hidden />;
}

export const RevenueChart = dynamic(
  () => import("@/components/admin/sales-chart").then((module) => module.RevenueChart),
  { ssr: false, loading: () => <ChartFallback height={280} /> },
);

export const CategoryChart = dynamic(
  () => import("@/components/admin/sales-chart").then((module) => module.CategoryChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> },
);
