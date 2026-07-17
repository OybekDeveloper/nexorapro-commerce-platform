# Architecture

## System context

```text
Customer storefront ─┐
                     ├── Next.js application ── Domain services ── PostgreSQL
Admin workspace ─────┘             │                    │
                                   │                    ├── Redis / jobs
                                   │                    ├── Object storage
                                   │                    └── Payment / delivery providers
                                   └── Auth + organization-aware RBAC
```

The storefront and admin workspace share product, pricing, inventory, localization, and order domains. Presentation code remains separate so the customer experience can be optimized independently from data-heavy admin workflows.

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
src/app              Routes, layouts, server entry points
src/components       Storefront, admin, and shared UI
src/lib              Types, domain helpers, adapters
future: src/server   Auth, services, repositories, jobs
future: db           Schema, migrations, seed data
```

## Mutation rules

All future mutations should follow:

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
