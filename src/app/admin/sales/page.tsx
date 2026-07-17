import { PointOfSale } from "@/components/admin/point-of-sale";

export default function SalesPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="text-sm font-medium text-brand">Point of sale</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Sotuv</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mahsulot tanlang, to‘lov usulini belgilang va sotuvni yakunlang.</p>
      </div>
      <PointOfSale />
    </div>
  );
}
