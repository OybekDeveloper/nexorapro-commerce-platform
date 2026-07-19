# nexorapro.dev Commerce

**Project 01/10 — Production-Grade Portfolio Series**

Premium electronics storefront and commerce management platform for small and large retailers. nexorapro.dev is designed to manage the full journey from supplier intake and inventory to multilingual publishing, orders, sales analytics, and the customer-facing store.

> Current status: **API-backed portfolio MVP complete**. Products, inventory, POS, checkout, orders, dashboard totals, localization completeness, and CSV export share a persistent SQLite source of truth. Authentication, real payments, cloud media storage, and production hardening remain separate production milestones.

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
| `/` | Premium storefront, product discovery, motion and video showcase | Database-backed |
| `/catalog` | Search, categories, filters and published product listing | Database-backed |
| `/product/[slug]` | Product details, shared-image transition and purchase controls | Database-backed |
| `/cart` | Persistent browser cart, promo and checkout order creation | API-backed |
| `/admin` | Executive commerce dashboard | Computed from database |
| `/admin/products` | Create, publish visibility, localization and archive lifecycle | API-backed |
| `/admin/sales` | POS cart, discount, payment, order and atomic stock deduction | API-backed |
| `/admin/inventory` | Stock receipt and inventory movement ledger | API-backed |
| `/admin/orders` | Online/POS orders, search, details and status workflow | API-backed |
| `/admin/analytics` | Product metrics and working order CSV export | Mixed live/demo analytics |
| `/admin/localization` | Persistent UZ/RU/EN completeness workflow | API-backed |

## Implemented full-stack foundation

The isolated client state has been replaced with one shared commerce source of truth:

- Next.js Route Handler REST API with Zod request validation
- Persistent SQLite database, WAL mode, schema bootstrap, indexes and deterministic seed data
- Shared products, orders, order line snapshots and inventory movement ledger
- Product create, visibility, localization completeness, stock receipt and archive actions
- Transactional POS/storefront order creation with server-side price and stock validation
- Live admin order status workflow, computed dashboard/analytics API and CSV export
- Dynamic storefront publishing: admin visibility changes affect catalog and product routes
- API integration verification plus desktop and 375px real-browser checks

## REST API

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Service and database health |
| `/api/products` | `GET`, `POST` | Admin/storefront catalog and product creation |
| `/api/products/[id]` | `GET`, `PATCH`, `DELETE` | Product update and safe archive |
| `/api/orders` | `GET`, `POST` | Online and POS order workflow |
| `/api/orders/[id]` | `GET`, `PATCH` | Order detail and status update |
| `/api/inventory` | `GET`, `POST` | Stock movements and receipts |
| `/api/analytics` | `GET` | Computed commerce totals |
| `/api/analytics/export` | `GET` | UTF-8 order CSV export |

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- shadcn/ui foundation
- TanStack Table
- Recharts
- GSAP Flip shared-element transitions
- better-sqlite3 persistent local database
- Custom nexorapro.dev SVG icon system and Lucide interaction icons
- Zod, React Hook Form (prepared for validated forms)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

The database is created automatically at `data/nexora.db`. Override it with `NEXORAPRO_DB_PATH` when an isolated database is needed.

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

## Current production limitations

- Authentication and RBAC are not connected yet.
- Product media uses local optimized assets and official external demo video URLs; upload storage is not connected yet.
- Checkout creates a real local order, but no external payment is captured in portfolio mode.
- SQLite is intended for the local/single-instance portfolio deployment; multi-instance production requires PostgreSQL and migrations.
- Localization currently persists locale completeness, not separate translated product copy.
- Conversion funnel and chart time-series remain illustrative; dashboard totals, product sales, order counts, stock, and CSV are database-derived.
- Supplier purchasing, transfers, refunds, audit logs, automated auth/security tests, and external delivery integrations are not implemented yet.

## Definition of production-ready for this project

The project will only be marked production-ready after database persistence, RBAC, validation, audit logs, security review, automated tests, observability, backups, deployment, and documented recovery procedures are implemented and verified.

## License

MIT
