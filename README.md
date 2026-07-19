# nexorapro.dev Commerce

**Project 01/10 — Production-Grade Portfolio Series**

Premium electronics storefront and commerce management platform for small and large retailers. nexorapro.dev is designed to manage the full journey from supplier intake and inventory to multilingual publishing, orders, sales analytics, and the customer-facing store.

> Current status: **Interactive MVP complete; API-backed commerce phase in progress**. The storefront and admin workflows run with realistic demo data. Persistent API, shared domain data, authentication, and production hardening are the active next phase.

## Product vision

nexorapro.dev serves electronics retailers that sell products such as smartphones, laptops, tablets, audio devices, and accessories. One platform connects:

- A premium, Apple-inspired storefront with an original visual identity
- Product catalog, variants, pricing, and storefront visibility
- UZ/RU/EN product content and localization status
- Supplier intake, warehouses, branches, and stock movements
- Orders, payments, delivery, returns, and refunds
- Sales, margin, category, and inventory analytics
- Multi-store organizations, users, RBAC, and audit logs

## Working routes

| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Premium storefront, product discovery, motion and video showcase | Interactive demo |
| `/catalog` | Search, categories, filters and product listing | Interactive demo |
| `/product/[slug]` | Product details, shared-image transition and purchase controls | Interactive demo |
| `/cart` | Persistent browser cart, promo and checkout preview | Interactive demo |
| `/admin` | Executive commerce dashboard | Interactive demo |
| `/admin/products` | Search, filters, create draft, language status, visibility | Interactive demo |
| `/admin/sales` | Product selection, cart, discount, payment method, stock deduction | Interactive demo |
| `/admin/inventory` | Search, stock receipt and movement history | Interactive demo |
| `/admin/orders` | Search, status workflow and order detail panel | Interactive demo |
| `/admin/analytics` | Revenue, category, product and funnel analytics | Demo analytics |
| `/admin/localization` | UZ/RU/EN completeness workflow | Interactive demo |

## Active full-stack phase

The next implementation phase has started and will replace isolated client mock state with one shared API-backed commerce source of truth:

- Next.js Route Handler REST API with Zod validation
- Persistent database schema and deterministic seed data
- Shared products, orders, inventory movements and localization data
- Admin CRUD connected to the customer storefront
- POS and checkout orders connected to one order workflow
- Computed dashboard/analytics responses and working exports
- Automated API and browser-flow verification

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- shadcn/ui foundation
- TanStack Table
- Recharts
- GSAP Flip shared-element transitions
- Custom nexorapro.dev SVG icon system and Lucide interaction icons
- Zod, React Hook Form (prepared for validated forms)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## Quality checks

```bash
npm run lint
npm run build
```

The current implementation has been checked at desktop and 375px mobile widths using a real browser. Keyboard focus, skip links, responsive tables/cards, reduced-motion preferences, and explicit form labels are included.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development roadmap](docs/ROADMAP.md)
- [Design system](docs/DESIGN_SYSTEM.md)

## Current limitations before the API phase lands

- Admin product and sales data currently resets after refresh.
- Admin and storefront still read separate seed collections.
- Authentication and RBAC are not connected yet.
- Product media uses local optimized assets and official external demo video URLs; upload storage is not connected yet.
- POS sales and storefront checkout do not yet create records in the admin order list.
- Analytics values are demo data and not financial records.

## Definition of production-ready for this project

The project will only be marked production-ready after database persistence, RBAC, validation, audit logs, security review, automated tests, observability, backups, deployment, and documented recovery procedures are implemented and verified.

## License

MIT
