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

## Milestone 2 — API and persistent commerce foundation

- [x] Audit interactive MVP gaps and define shared API source of truth
- [x] Add validated REST API route handlers
- [x] Add persistent local development database and deterministic seed
- [x] Connect admin and storefront to shared repositories
- [x] Add transactional POS and online checkout order creation
- [x] Add inventory movement ledger, order status API, analytics response, and CSV export

## Milestone 2.1 — Authentication and production database

- [x] Add versioned SQLite migrations with pre-migration snapshots
- [ ] Add PostgreSQL for multi-instance scale
- [ ] Add organization, store, user, role, and permission models
- [x] Implement authentication and database session handling
- [x] Protect admin routes and every mutation boundary
- [x] Add audit logs and environment-seeded admin account

## Milestone 3 — Catalog and multilingual publishing

- [x] CRUD and bulk lifecycle for products and variants
- [x] Persistent product media upload with MIME/size validation
- [x] UZ/RU/EN translations with completeness state
- [ ] Draft, review, scheduled publish, and archive lifecycle
- [ ] Storefront visibility by store and locale

## Milestone 4 — Suppliers and inventory

- [ ] Supplier and purchase-order management
- [ ] Goods receipt with purchase cost
- [x] Append-only stock movement ledger
- [x] Inventory locations and stock reservations
- [x] Low-stock, available-stock, valuation and reconciliation reports

## Milestone 5 — Extended orders and payments

- [x] Browser-persistent cart and API-backed checkout
- [x] Core order workflow and status updates
- [x] Audited order status transitions and cancellation stock restoration
- [ ] Payment provider integration with idempotency
- [ ] Delivery provider integration
- [ ] Returns, refunds, and invoices

## Milestone 6 — Analytics and operations

- [x] Database-derived revenue, gross profit, order count, stock, and product sales totals
- [x] Category sales API response
- [x] Full channel and date-range reporting UI
- [ ] Conversion funnel and inventory turnover
- [x] CSV order export
- [ ] PDF export
- [ ] Background jobs, notifications, and scheduled reports

## Milestone 7 — Production hardening

- [x] Isolated production-server integration tests
- [x] Deterministic database performance benchmark
- [x] Rate limits, security headers, dependency review and structured API errors
- [ ] External error tracking, uptime checks, and alerts
- [x] Automatic migration backups and recovery script
- [ ] Demo data, screenshots, video, live deployment, and `v1.0` release
