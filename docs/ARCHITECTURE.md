# Architecture

## System context

```text
Customer storefront ─┐
                     ├── Next.js 16 application ── repositories ── SQLite (current)
Admin workspace ─────┘             │                         ├── users + bcrypt hashes
                                   ├── Route Handler API     └── opaque database sessions
                                   └── tagged Data Cache + tag/path revalidation
```

The storefront and admin workspace share product, pricing, inventory, localization, and order domains. Presentation code remains separate so the customer experience can be optimized independently from data-heavy admin workflows. Admin authorization is repeated at the Route Handler/data boundary; layout redirects are only a user-experience gate.

## Authentication and cache boundaries

- Passwords are bcrypt-hashed; raw passwords and session tokens are never stored.
- The browser receives an opaque 256-bit token in an HttpOnly, SameSite=Lax cookie; SQLite stores only its SHA-256 hash.
- Customer, admin and public roles are enforced for each API operation. Mutation requests with an `Origin` header must match the application origin.
- Public product reads use tagged Data Cache entries. Product, order and inventory mutations immediately expire affected tags and revalidate storefront/admin paths.
- Session and customer-specific data are never placed in the shared Data Cache.

## Core domains

### Identity and audit

- `User`: customer or administrator with a bcrypt password hash
- `Session`: SHA-256 hash of an opaque browser token with expiry and device metadata
- `LoginAttempt`: database-backed brute-force lock state
- `AuditLog`: actor, action, entity, before/after snapshot, request ID, IP, timestamp

The current deployment is single-business. Organization/membership boundaries
are a future multi-tenant concern and are not implied by the current schema.

### Catalog and localization

- `Product`: stable commercial identity and lifecycle status
- `ProductTranslation`: localized name, description, image alt text, badge, specs and video labels
- `ProductVariant`: SKU, option map, barcode, price, cost, stock, status and version
- `ProductMedia`: durable image/video metadata, ordering and primary selection
- soft deletion and optimistic product/variant versions

Translations are stored as separate records rather than JSON so completeness, review status, and locale-specific search can be managed explicitly.

### Pricing and inventory

- `InventoryLocation`, `InventoryMovement`, `InventoryReservation`

Inventory uses an append-only movement ledger and transactionally maintained
product/variant balances. Reservations reduce available stock without changing
on-hand stock. Idempotency keys prevent duplicate adjustments.

### Commerce

- `Order`, immutable `OrderItem` price/cost/name/SKU snapshots
- validated status transitions and cancellation stock restoration
- customer account history and admin/POS order workflows

Money is stored as whole UZS integer values. Orders copy product names, variant labels, SKUs, cost and sale prices into immutable line snapshots. Currency conversion, tax calculation and an external payment gateway are deliberately outside the current scope.

## Application boundaries

```text
src/app              Routes, layouts, server pages, and REST route handlers
src/components       Storefront, admin, and shared UI
src/lib              Shared schemas, API client, types, helpers, and adapters
src/server           SQLite bootstrap, repositories, transactions, HTTP errors
data/nexora.db        Ignored local persistent database created at runtime
```

## Mutation rules

Current commerce mutations follow this complete sequence:

1. Authenticate the user.
2. Re-check role permissions at the Route Handler boundary.
3. Validate input with Zod.
4. Execute a transaction through a domain service.
5. Write an audit event.
6. Revalidate affected storefront/admin routes.
7. Keep slow external work out of the request path (future queue integrations).

## Cache decision

Storefront products use Next.js tagged Data Cache with explicit invalidation;
admin/customer reads are private and uncached. The reproducible benchmark uses
10,000 products, 5,000 orders and 15,000 lines: indexed admin pagination is
sub-millisecond and the optimized 50-line product lookup is a fixed query.
Redis is intentionally not deployed on the single 1 GB, single-process VPS: it
would add a network hop, memory pressure and a second invalidation system without
removing the measured bottleneck. Redis becomes appropriate for multiple app
instances, shared rate limits, queues, or a measured cross-process cache need.

## Non-functional requirements

- Accessible keyboard navigation and WCAG AA contrast
- Mobile layouts at 375px and data-table fallback cards
- Idempotent manual stock adjustments and atomic order/stock mutations
- Structured API errors, request IDs, audit history, and business reports
- Pre-migration SQLite snapshots and explicit restore tooling
- Rate limiting, secure headers, validation, and secret isolation
- Integration tests for auth, catalog, variants/media, inventory, reports and RBAC
