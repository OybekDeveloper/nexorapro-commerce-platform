import { ProductsTable } from "@/components/admin/products-table";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="text-sm font-medium text-brand">Katalog boshqaruvi</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Mahsulotlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Narx, qoldiq, tarjima va saytdagi ko‘rinishni bir joydan boshqaring.</p>
      </div>
      <ProductsTable />
    </div>
  );
}
