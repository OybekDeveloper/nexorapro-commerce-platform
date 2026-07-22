"use client";

import { useMemo, useState } from "react";
import { Check, Languages, Loader2, Pencil, Save, Search } from "lucide-react";

import { useProductStore } from "@/components/admin/product-store";
import type { Product, ProductLanguage, ProductTranslation } from "@/lib/types";
import { cn } from "@/lib/utils";

const locales: ProductLanguage[] = ["UZ", "RU", "EN"];
const localeNames: Record<ProductLanguage, string> = { UZ: "O‘zbekcha", RU: "Русский", EN: "English" };

function translationFor(product: Product, locale: ProductLanguage): ProductTranslation {
  const saved = product.translations?.[locale];
  if (saved) return saved;
  if (locale === "UZ") {
    return {
      name: product.name,
      description: product.description ?? "",
      imageAlt: product.imageAlt ?? product.name,
      badge: product.badge,
      specs: product.specs ?? [],
    };
  }
  return { name: "", description: "", imageAlt: "", badge: "", specs: [] };
}

export function LocalizationWorkspace() {
  const { products, saveProductTranslation } = useProductStore();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<ProductLanguage>("RU");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductTranslation | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => products.filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()),
  ), [products, query]);
  const totalTranslations = products.length * locales.length;
  const readyTranslations = products.reduce((sum, product) => sum + product.languages.length, 0);
  const progress = totalTranslations ? Math.round((readyTranslations / totalTranslations) * 100) : 0;
  const localeStats = locales.map((locale) => ({
    locale,
    ready: products.filter((product) => product.languages.includes(locale)).length,
    total: products.length,
  }));

  const openEditor = (product: Product) => {
    setEditingId(product.id);
    setDraft(translationFor(product, language));
    setSaveError(null);
  };

  const changeLanguage = (locale: ProductLanguage) => {
    setLanguage(locale);
    const product = products.find((item) => item.id === editingId);
    if (product) setDraft(translationFor(product, locale));
  };

  const updateDraft = <K extends keyof ProductTranslation>(field: K, value: ProductTranslation[K]) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  };

  const save = async () => {
    if (!editingId || !draft || draft.name.trim().length < 2 || draft.description.trim().length < 2) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProductTranslation(editingId, language, {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        imageAlt: draft.imageAlt.trim() || draft.name.trim(),
        badge: draft.badge?.trim() || undefined,
        specs: draft.specs.map((item) => item.trim()).filter(Boolean),
        videoTitle: draft.videoTitle?.trim() || undefined,
        videoEyebrow: draft.videoEyebrow?.trim() || undefined,
      });
      setEditingId(null);
      setDraft(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Tarjima saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <article className="rounded-2xl border border-brand/20 bg-brand/[0.045] p-5 shadow-sm">
          <div className="flex items-start justify-between"><span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand text-white"><Languages className="size-5" /></span><strong className="text-3xl tracking-tight text-brand">{progress}%</strong></div>
          <h2 className="mt-5 font-semibold">Umumiy tarjima holati</h2>
          <p className="mt-1 text-sm text-muted-foreground">{readyTranslations}/{totalTranslations} ta locale kontenti DB’da tayyor.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand/15"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} /></div>
        </article>
        <div className="grid gap-3 sm:grid-cols-3">{localeStats.map((stat) => { const percentage = stat.total ? Math.round((stat.ready / stat.total) * 100) : 0; return <article key={stat.locale} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-sm font-bold">{stat.locale}</span><span className={cn("rounded-full px-2 py-1 text-xs font-semibold", percentage === 100 ? "bg-brand/10 text-brand" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>{percentage}%</span></div><p className="mt-5 font-semibold">{stat.ready}/{stat.total} tayyor</p><p className="mt-1 text-xs text-muted-foreground">{localeNames[stat.locale]} kontenti</p></article>; })}</div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tarjima mahsulotini qidirish" placeholder="Mahsulot yoki SKU qidirish..." className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          <div className="flex rounded-xl bg-muted p-1">{locales.map((item) => <button key={item} type="button" onClick={() => changeLanguage(item)} className={cn("h-8 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors", language === item ? "bg-background text-brand shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((product) => {
            const ready = product.languages.includes(language);
            const editing = editingId === product.id && draft;
            return (
              <article key={product.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3"><span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">{product.name.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.category}</p></div></div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex gap-1">{locales.map((locale) => <span key={locale} className={cn("inline-flex size-8 items-center justify-center rounded-lg text-[10px] font-bold", product.languages.includes(locale) ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground")}>{locale}</span>)}</div>
                    <button type="button" onClick={() => editing ? (setEditingId(null), setDraft(null)) : openEditor(product)} className={cn("inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-xs font-semibold", ready ? "bg-brand/10 text-brand" : "bg-brand text-white")}><Pencil className="size-3.5" />{ready ? "Tahrirlash" : "Tarjima kiritish"}</button>
                  </div>
                </div>
                {editing && <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/[0.025] p-4">
                  <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">{language} · {localeNames[language]}</p><p className="mt-0.5 text-xs text-muted-foreground">Barcha maydonlar API orqali product tarjimasiga yoziladi.</p></div>{ready && <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand"><Check className="size-3.5" />Saqlangan</span>}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Mahsulot nomi *</span><input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Tavsif *</span><textarea rows={4} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5"><span className="text-sm font-medium">Rasm alt matni</span><input value={draft.imageAlt} onChange={(event) => updateDraft("imageAlt", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5"><span className="text-sm font-medium">Badge</span><input value={draft.badge ?? ""} onChange={(event) => updateDraft("badge", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Xususiyatlar (har biri yangi qatorda)</span><textarea rows={4} value={draft.specs.join("\n")} onChange={(event) => updateDraft("specs", event.target.value.split("\n"))} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5"><span className="text-sm font-medium">Video sarlavhasi</span><input value={draft.videoTitle ?? ""} onChange={(event) => updateDraft("videoTitle", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                    <label className="space-y-1.5"><span className="text-sm font-medium">Video eyebrow</span><input value={draft.videoEyebrow ?? ""} onChange={(event) => updateDraft("videoEyebrow", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
                  </div>
                  {saveError && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{saveError}</p>}
                  <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setEditingId(null); setDraft(null); }} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Bekor qilish</button><button type="button" onClick={() => void save()} disabled={saving || draft.name.trim().length < 2 || draft.description.trim().length < 2} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Saqlash</button></div>
                </div>}
              </article>
            );
          })}
          {filtered.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Mahsulot topilmadi.</div>}
        </div>
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Tarjima holati va matnlari persistent API hamda SQLite DB’dan olinadi.</div>
      </section>
    </div>
  );
}
