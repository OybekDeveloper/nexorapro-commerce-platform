import { LocalizationWorkspace } from "@/components/admin/localization-workspace";

export default function LocalizationPage() {
  return <div className="mx-auto max-w-[1600px] space-y-6"><div><p className="text-sm font-medium text-brand">UZ · RU · EN</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Tarjimalar</h1><p className="mt-1 text-sm text-muted-foreground">Mahsulot kontenti va storefront locale tayyorligini boshqaring.</p></div><LocalizationWorkspace /></div>;
}
