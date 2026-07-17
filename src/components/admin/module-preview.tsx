import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";

type ModulePreviewProps = {
  eyebrow: string;
  title: string;
  description: string;
  ready: string[];
  next: string[];
};

export function ModulePreview({ eyebrow, title, description, ready, next }: ModulePreviewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-sm font-medium text-brand">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><h2 className="font-semibold">Rejalashtirilgan imkoniyatlar</h2><div className="mt-4 space-y-3">{ready.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3"><CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-brand" /><span className="text-sm">{item}</span></div>)}</div></section>
        <section className="rounded-2xl border border-dashed border-border bg-card/60 p-5 sm:p-6"><h2 className="font-semibold">Keyingi development bosqichi</h2><div className="mt-4 space-y-3">{next.map((item) => <div key={item} className="flex items-start gap-3 p-3"><CircleDashed className="mt-0.5 size-[18px] shrink-0 text-brand" /><span className="text-sm text-muted-foreground">{item}</span></div>)}</div><div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">Portfolio roadmap <ArrowRight className="size-3.5" /></div></section>
      </div>
    </div>
  );
}
