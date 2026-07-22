<div align="center">

# nexorapro.uz Commerce

**A full-stack electronics storefront and commerce operations platform.**

Storefront, inventory, orders, point of sale, analytics, localization, and
role-based administration — built as one production-minded Next.js application.

[![Live](https://img.shields.io/badge/live-nexorapro.uz-0f8a70?style=for-the-badge)](https://nexorapro.uz)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/deploy-GitHub_Actions-2088ff?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/deploy-production.yml)

[Live storefront](https://nexorapro.uz) · [Architecture](docs/ARCHITECTURE.md) · [Deployment guide](docs/DEPLOYMENT.md) · [Roadmap](docs/ROADMAP.md)

</div>

![nexorapro.uz premium electronics storefront](docs/assets/storefront-home.png)

## Overview

nexorapro.uz is a secured full-stack commerce MVP for electronics retailers.
It connects a premium customer experience with the operational tools needed to
publish products, receive inventory, process sales, manage orders, and review
business performance.

The storefront and admin workspace share one persistent source of truth. A
product published in the admin panel becomes available in the storefront; an
order updates stock and appears in operational reporting without duplicated
client-side state.

> **Portfolio project 01/10.** The current release targets a single Ubuntu VPS
> and uses SQLite intentionally. The architecture documents the migration path
> to PostgreSQL and object storage for multi-instance production workloads.

## Product highlights

| Customer experience | Commerce operations | Platform foundation |
| --- | --- | --- |
| Premium responsive storefront | Executive dashboard and analytics | Next.js App Router and Route Handlers |
| Searchable product catalog | Product publishing and archive lifecycle | Persistent SQLite in WAL mode |
| Product details and video showcase | POS sale with atomic stock deduction | Database-backed sessions and RBAC |
| Persistent cart and checkout | Inventory receipts and movement ledger | Zod validation and typed repositories |
| Map-based delivery location | Order status workflow and CSV export | Tagged cache invalidation |
| Account and private order history | UZ/RU/EN localization workflow | GitHub Actions VPS deployment |

## Admin workspace

![nexorapro.uz commerce admin dashboard](docs/assets/admin-dashboard.png)

The admin experience includes dedicated workspaces for products, sales,
inventory, orders, analytics, and localization. Private actions are protected at
the server/API boundary; hiding a navigation item is never treated as
authorization.

## Architecture

```text
Customer storefront ─┐
                     ├─ Next.js 16 application ─ Route Handlers ─ repositories ─ SQLite
Admin workspace ─────┘           │                    │                 │
                                 │                    │                 ├─ users + sessions
                                 │                    │                 ├─ products + stock
                                 │                    │                 └─ orders + movements
                                 │                    └─ Zod + RBAC + cache invalidation
                                 └─ React 19 + Tailwind CSS + GSAP
```

Important implementation decisions:

- money and stock calculations are validated on the server;
- order creation and inventory deduction run in one transaction;
- passwords are hashed with bcrypt and raw session tokens are never stored;
- customer and admin data are excluded from shared caches;
- public product and analytics caches are invalidated after mutations;
- the SQLite database lives outside deployment releases and survives rollouts.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for domain boundaries and the
long-term data model.

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript 5 |
| UI | Tailwind CSS 4, shadcn/ui foundation, Base UI, Lucide |
| Forms and validation | React Hook Form, Zod |
| Data and authentication | better-sqlite3, bcrypt, opaque HttpOnly sessions |
| Tables and analytics | TanStack Table, Recharts |
| Motion and maps | GSAP, Leaflet, OpenStreetMap, Nominatim |
| Production | GitHub Actions, Next.js standalone output, PM2, Nginx, Let's Encrypt |

## Working routes

| Route | Purpose |
| --- | --- |
| `/`, `/catalog`, `/product/[slug]` | Storefront discovery and product purchase flow |
| `/cart` | Cart and map-assisted checkout |
| `/login`, `/account` | Customer authentication and private order history |
| `/admin-login` | Separate administrator entry point |
| `/admin` | Business overview and live database totals |
| `/admin/products` | Product creation, publishing, localization, and archive actions |
| `/admin/sales` | Point of sale and stock-aware order creation |
| `/admin/inventory` | Stock receipt and inventory movement history |
| `/admin/orders` | Order search, details, and status transitions |
| `/admin/analytics` | Product metrics and CSV export |
| `/admin/localization` | UZ/RU/EN completeness workflow |
| `/api/*` | Authenticated REST-style Route Handler API |

## Local development

Requirements: Node.js 24 and npm.

```bash
git clone https://github.com/OybekDeveloper/nexorapro-commerce-platform.git
cd nexorapro-commerce-platform
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is created
automatically at `data/nexora.db`.

Production never uses the development admin fallback. Set a unique
`ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first production start.

## Environment and secret safety

Only non-secret templates are committed:

- [`.env.example`](.env.example) — local development template;
- [`.github/production.env.example`](.github/production.env.example) — value
  template for the multiline `PRODUCTION_ENV_FILE` GitHub secret;
- [`.github/github-actions-secrets.example`](.github/github-actions-secrets.example)
  — names of all required deployment secrets.

Real `.env*` files, `.server-access`, SSH keys, and SQLite files are ignored.
The CI packaging step also fails if an environment or database file enters the
standalone release.

## Quality checks

```bash
npm run lint
npm run build
```

The interface includes keyboard focus states, a skip link, semantic labels,
reduced-motion handling, responsive admin fallbacks, and layouts verified at
desktop and 375 px widths.

## Production deployment

Every push to `main` runs the production workflow:

1. install locked dependencies on a GitHub-hosted Ubuntu runner;
2. run ESLint and build the Next.js standalone server;
3. verify that no `.env` or SQLite files entered the release;
4. upload the compressed runtime to the VPS over pinned-key SSH;
5. atomically activate the release and reload one PM2 process;
6. call `/api/health` and automatically roll back on failure.

The VPS does **not** run `npm install` or `next build`, making the deployment
suitable for the initial 1 GB instance. Full setup instructions are in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Current scope

This repository is a portfolio MVP, not a live payment processor. Checkout
creates real local orders, while payment capture, media upload storage,
password recovery, email verification, refunds, supplier purchasing, audit
logs, and external delivery integrations remain roadmap work. Multi-instance
deployment requires PostgreSQL and formal migrations.

Product imagery and linked showcase media belong to their respective owners and
are used for portfolio demonstration. Prices and inventory are illustrative.

## Project links

- Website: [https://nexorapro.uz](https://nexorapro.uz)
- Source and author: [OybekDeveloper on GitHub](https://github.com/OybekDeveloper)
- LinkedIn build story: link will be added after the launch post is published

<!-- LINKEDIN_POST_URL: Replace the line above with the final LinkedIn post URL. -->

## License

Released under the [MIT License](LICENSE).
