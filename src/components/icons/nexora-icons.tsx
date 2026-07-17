import type { SVGProps } from "react";

export type NexoraIconName =
  | "dashboard"
  | "product"
  | "inventory"
  | "sale"
  | "order"
  | "analytics"
  | "language"
  | "store"
  | "revenue"
  | "receipt"
  | "average"
  | "return"
  | "wallet"
  | "cash"
  | "card"
  | "installment"
  | "customer"
  | "discount"
  | "check";

type NexoraIconProps = SVGProps<SVGSVGElement> & { name: NexoraIconName };

const paths: Record<NexoraIconName, React.ReactNode> = {
  dashboard: <><path d="M4 4h6v6H4zM14 4h6v9h-6zM4 14h6v6H4zM14 17h6v3h-6z" /></>,
  product: <><path d="m12 3 8 4.3v9.4L12 21l-8-4.3V7.3z" /><path d="m4.4 7.5 7.6 4.1 7.6-4.1M12 21v-9.4M8.2 5.1l7.7 4.2" /></>,
  inventory: <><path d="M3 8.5h18V20H3zM5 4h14l2 4.5H3zM8 12h8M10 16h4" /></>,
  sale: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h4M16 15.5a1.5 1.5 0 1 0 0 .01" /></>,
  order: <><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" /><path d="M4 6h2M18 6h2" /></>,
  analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><path d="m3 7 6-4 6 6 6-5" /></>,
  language: <><path d="M4 5h10M9 3v2c0 5-2 8-5 10M6 10c2 2 4 3 7 4" /><path d="m14 20 3.5-9 3.5 9M15.2 17h4.6" /></>,
  store: <><path d="M4 10v10h16V10M3 4h18l-1 6c-2 1.5-4 1.5-6 0-2 1.5-4 1.5-6 0-2 1.5-4 1.5-6 0z" /><path d="M9 20v-5h6v5" /></>,
  revenue: <><path d="M3 6h18v12H3z" /><path d="M7 12h.01M17 12h.01M12 9c-2 0-2 2 0 2s2 2 0 2M12 8v1M12 13v1" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  average: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></>,
  return: <><path d="M9 8H4V3M4.5 8a8 8 0 1 1-.5 7" /><path d="M12 8v4l3 2" /></>,
  wallet: <><path d="M3 6h16v14H3zM5 3h12v3" /><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z" /></>,
  cash: <><path d="M3 6h18v12H3z" /><circle cx="12" cy="12" r="3" /><path d="M6 9h.01M18 15h.01" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  installment: <><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /><path d="M12 5v14" /></>,
  customer: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-5 3.4-7 8-7s7.3 2 8 7" /></>,
  discount: <><path d="m4 12 8-8 8 8-8 8z" /><path d="M9 15 15 9M9.5 9.5h.01M14.5 14.5h.01" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
};

export function NexoraIcon({ name, className, ...props }: NexoraIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function NexoraMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className} {...props}>
      <path d="M6 23.5V8.5L16 4l10 4.5v15L16 28 6 23.5Z" fill="currentColor" opacity=".14" />
      <path d="M8.5 22V10l7.5 9 7.5-9v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
