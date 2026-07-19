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

### Identity and tenancy

- `Organization`: the business that owns data
- `Store`: online or physical sales channel
- `Location`: warehouse or branch
- `User`, `Role`, `Permission`, `Membership`: organization-scoped access
- `AuditLog`: actor, action, entity, before/after snapshot, timestamp

Every business record carries `organizationId`. Authorization must validate organization membership before querying or mutating data.

### Catalog and localization

- `Product`: stable commercial identity and lifecycle status
- `ProductTranslation`: localized name, description, slug, and SEO fields
- `ProductVariant`: SKU, attributes, barcode, weight, media, and status
- `Category`, `Collection`, `MediaAsset`
- `ChannelPublication`: storefront visibility, publish window, and market

Translations are stored as separate records rather than JSON so completeness, review status, and locale-specific search can be managed explicitly.

### Pricing and inventory

- `PriceList`, `Price`, `DiscountRule`
- `Supplier`, `PurchaseOrder`, `GoodsReceipt`
- `InventoryItem`, `StockMovement`, `StockReservation`

Inventory uses an append-only movement ledger. The current balance is derived or cached, while the ledger preserves an auditable history of receipts, sales, returns, transfers, and corrections.

### Commerce

- `Customer`, `Address`
- `Cart`, `CartItem`
- `Order`, `OrderItem`, `OrderStatusHistory`
- `Payment`, `Shipment`, `Return`, `Refund`

Money is stored in minor units using integers; currency is stored explicitly. Orders copy product names, SKUs, prices, and tax data into immutable line snapshots.

## Application boundaries

```text
src/app              Routes, layouts, server pages, and REST route handlers
src/components       Storefront, admin, and shared UI
src/lib              Shared schemas, API client, types, helpers, and adapters
src/server           SQLite bootstrap, repositories, transactions, HTTP errors
data/nexora.db        Ignored local persistent database created at runtime
```

## Mutation rules

Current commerce mutations follow steps 3–6. Production mutations will follow the complete sequence:

1. Authenticate the user.
2. Resolve organization and role permissions.
3. Validate input with Zod.
4. Execute a transaction through a domain service.
5. Write an audit event.
6. Revalidate affected storefront/admin routes.
7. Queue slow external work such as media processing or notifications.

## Non-functional requirements

- Accessible keyboard navigation and WCAG AA contrast
- Mobile layouts at 375px and data-table fallback cards
- Idempotent payment and stock mutations
- Structured logs, error tracking, and business metrics
- Point-in-time database recovery and media backups
- Rate limiting, secure headers, validation, and secret isolation
- Integration tests for inventory, checkout, refunds, and RBAC
