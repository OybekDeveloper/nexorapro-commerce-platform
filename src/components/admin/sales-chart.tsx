"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RevenuePoint = { date: string; revenue: number };
type CategoryPoint = { name: string; value: number };

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{payload[0].value} mln UZS</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[280px] w-full" role="img" aria-label="Iyul oyidagi sotuv tushumi o‘sish grafigi">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10a184" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10a184" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" className="text-border" strokeDasharray="4 4" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "currentColor", fontSize: 12 }} className="text-muted-foreground" dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "currentColor", fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#10a184", strokeDasharray: "4 4" }} />
          <Area type="monotone" dataKey="revenue" stroke="#10a184" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, fill: "#10a184", stroke: "white", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  return (
    <div className="h-[220px] w-full" role="img" aria-label="Kategoriya bo‘yicha sotuvlar taqqoslanishi">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={76} tick={{ fill: "currentColor", fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip cursor={{ fill: "currentColor", opacity: 0.04 }} />
          <Bar dataKey="value" fill="#10a184" radius={[0, 8, 8, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
