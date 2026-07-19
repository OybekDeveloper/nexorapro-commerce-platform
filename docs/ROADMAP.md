# Development roadmap

## Milestone 1 — Product and UI foundation

- [x] Define retail use case and platform scope
- [x] Create design system
- [x] Build premium storefront concept
- [x] Build responsive admin shell and executive dashboard
- [x] Add interactive product table and create-draft flow
- [x] Add purchase price, selling price, margin, status, and publishing fields
- [x] Add interactive POS flow with cart, payment method, and stock deduction
- [x] Create custom monochrome icon system and `#10a184` brand refresh
- [x] Document architecture and production criteria

## Milestone 2 — Database, authentication, and RBAC

- [x] Audit interactive MVP gaps and define shared API source of truth
- [ ] Add validated REST API route handlers
- [ ] Add persistent local development database and deterministic seed
- [ ] Connect admin and storefront to shared repositories
- [ ] Add PostgreSQL and migrations
- [ ] Add organization, store, user, role, and permission models
- [ ] Implement authentication and session handling
- [ ] Protect admin routes and server actions
- [ ] Add audit logs and seed accounts

## Milestone 3 — Catalog and multilingual publishing

- [ ] CRUD for products, variants, categories, and collections
- [ ] Product media upload and optimization
- [ ] UZ/RU/EN translations with completeness state
- [ ] Draft, review, scheduled publish, and archive lifecycle
- [ ] Storefront visibility by store and locale

## Milestone 4 — Suppliers and inventory

- [ ] Supplier and purchase-order management
- [ ] Goods receipt with purchase cost
- [ ] Append-only stock movement ledger
- [ ] Warehouses, branches, transfers, reservations
- [ ] Low-stock rules and reconciliation

## Milestone 5 — Orders and payments

- [ ] Cart and checkout
- [ ] Order workflow and status history
- [ ] Payment provider integration with idempotency
- [ ] Delivery provider integration
- [ ] Returns, refunds, and invoices

## Milestone 6 — Analytics and operations

- [ ] Revenue, gross profit, margin, and average order value
- [ ] Product/category/channel comparison
- [ ] Conversion funnel and inventory turnover
- [ ] CSV/PDF export
- [ ] Background jobs, notifications, and scheduled reports

## Milestone 7 — Production hardening

- [ ] Unit, integration, and end-to-end tests
- [ ] Accessibility and performance audit
- [ ] Rate limits, security headers, and dependency review
- [ ] Logging, error tracking, uptime checks, and alerts
- [ ] Backups and recovery drill
- [ ] Demo data, screenshots, video, live deployment, and `v1.0` release
