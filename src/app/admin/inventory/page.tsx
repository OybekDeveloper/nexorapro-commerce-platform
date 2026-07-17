import { InventoryWorkspace } from "@/components/admin/inventory-workspace";

export default function InventoryPage() {
  return <div className="mx-auto max-w-[1600px] space-y-6"><div><p className="text-sm font-medium text-brand">Supply chain</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Ombor va kirim</h1><p className="mt-1 text-sm text-muted-foreground">Qoldiq, ombor qiymati, kirim va mahsulot harakatlarini bir joydan boshqaring.</p></div><InventoryWorkspace /></div>;
}
