import { AnalyticsWorkspace } from "@/components/admin/analytics-workspace";

export default function AnalyticsPage() {
  return <div className="mx-auto max-w-[1600px] space-y-6"><div><p className="text-sm font-medium text-brand">Business intelligence</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Kengaytirilgan analitika</h1><p className="mt-1 text-sm text-muted-foreground">Sotuv, marja, kategoriya va conversion ko‘rsatkichlarini taqqoslang.</p></div><AnalyticsWorkspace /></div>;
}
