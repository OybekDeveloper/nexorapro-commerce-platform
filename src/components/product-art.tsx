import { cn } from "@/lib/utils";

type ProductArtProps = {
  kind: "phone" | "laptop" | "audio" | "tablet";
  tone?: "teal" | "silver" | "black";
};

const tones = {
  teal: "from-[#3cc7ae] via-[#d9f6ef] to-[#087866]",
  silver: "from-zinc-200 via-white to-zinc-500",
  black: "from-zinc-600 via-zinc-950 to-black",
};

export function ProductArt({ kind, tone = "silver" }: ProductArtProps) {
  if (kind === "laptop") {
    return (
      <div className="relative h-40 w-64" aria-hidden="true">
        <div className={cn("absolute left-8 top-0 h-36 w-52 rounded-t-xl border-[5px] border-zinc-700 bg-gradient-to-br p-2 shadow-2xl", tones[tone])}>
          <div className="h-full w-full rounded-md bg-[radial-gradient(circle_at_65%_35%,#dbeafe,transparent_22%),linear-gradient(145deg,#111827,#334155_55%,#0f172a)]" />
        </div>
        <div className="absolute bottom-0 left-0 h-2.5 w-64 rounded-b-xl bg-gradient-to-b from-zinc-200 to-zinc-500 shadow-lg" />
        <div className="absolute bottom-0 left-[106px] h-1 w-12 rounded-b bg-zinc-400" />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className="relative h-44 w-52" aria-hidden="true">
        <div className="absolute left-6 top-1 h-28 w-16 rotate-[-12deg] rounded-[2rem] bg-gradient-to-b from-white to-zinc-300 shadow-xl">
          <div className="mx-auto mt-3 size-9 rounded-full bg-zinc-900 ring-4 ring-zinc-300" />
          <div className="mx-auto mt-2 h-14 w-3 rounded-full bg-zinc-200" />
        </div>
        <div className="absolute right-6 top-4 h-28 w-16 rotate-12 rounded-[2rem] bg-gradient-to-b from-white to-zinc-300 shadow-xl">
          <div className="mx-auto mt-3 size-9 rounded-full bg-zinc-900 ring-4 ring-zinc-300" />
          <div className="mx-auto mt-2 h-14 w-3 rounded-full bg-zinc-200" />
        </div>
        <div className="absolute bottom-1 left-10 h-20 w-32 rounded-[2.2rem] border border-zinc-300 bg-white shadow-2xl" />
      </div>
    );
  }

  if (kind === "tablet") {
    return (
      <div className={cn("relative h-52 w-40 rotate-3 rounded-[1.3rem] bg-gradient-to-br p-2 shadow-2xl", tones[tone])} aria-hidden="true">
        <div className="h-full w-full overflow-hidden rounded-[0.9rem] bg-[radial-gradient(circle_at_30%_20%,#99eadb,transparent_30%),radial-gradient(circle_at_70%_70%,#10a184,transparent_32%),#102622]" />
      </div>
    );
  }

  return (
    <div className={cn("relative h-52 w-28 -rotate-6 rounded-[2rem] bg-gradient-to-br p-[5px] shadow-2xl", tones[tone])} aria-hidden="true">
      <div className="relative h-full w-full overflow-hidden rounded-[1.7rem] bg-[radial-gradient(circle_at_62%_30%,#8fe4d4,transparent_25%),radial-gradient(circle_at_30%_75%,#10a184,transparent_28%),linear-gradient(160deg,#071713,#17362f)]">
        <div className="absolute left-1/2 top-2 h-4 w-12 -translate-x-1/2 rounded-full bg-black" />
        <div className="absolute bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/60" />
      </div>
    </div>
  );
}
