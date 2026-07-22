# Commerce API reference

All APIs are same-origin Next.js Route Handlers. Admin endpoints authenticate
the opaque HttpOnly session on every request. Mutations require a matching
`Origin` when the header is present and reject `Sec-Fetch-Site: cross-site`.

## Error contract

Every API error uses the same structure and includes an ID that can be matched
to server logs:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kiritilgan ma’lumot noto‘g‘ri",
    "requestId": "998b1775-7e44-4f83-a34d-dff124830a52",
    "details": [
      { "path": "variants.0.sku", "message": "Required", "code": "invalid_type" }
    ]
  }
}
```

Common status codes are `400` malformed JSON/query, `401` unauthenticated,
`403` forbidden/origin mismatch, `404` missing entity, `409` version/stock/state
conflict, `413` payload too large, `415` unsupported content type, `422` field
validation, `429` login rate limit, and sanitized `500` errors.

## Catalog

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/products` | Admin pagination, search, status/category filter, whitelist sort; supports `includeDeleted=true` |
| `GET` | `/api/products?scope=storefront` | Public published/visible DTO only; cost, audit, version and deletion internals are never serialized |
| `POST` | `/api/products` | Atomic product, translations, variants, media, initial stock and audit creation |
| `GET` | `/api/products/:id-or-slug` | Sanitized public DTO when published/visible; full record only for admin |
| `PATCH` | `/api/products/:id` | Partial update; pass `version` for optimistic concurrency |
| `DELETE` | `/api/products/:id` | Recoverable soft delete |
| `POST` | `/api/products/bulk` | `archive`, `restore`, `delete`, `publish`, or `draft`; maximum 100 IDs |
| `POST` | `/api/products/media` | Admin multipart upload; JPEG/PNG/WebP/AVIF, maximum 8 MB |
| `GET` | `/api/products/export?format=csv\|json` | Full catalog with variant/media JSON columns |
| `POST` | `/api/products/import?mode=upsert&dryRun=true` | `text/csv`; validate before applying transactionally |

Admin list query fields: `page`, `pageSize` (maximum 100), `query`, `status`,
`category`, `sort`, `direction`, and `includeDeleted`.

CSV import requires `name`, `sku`, `category`, `cost_price`, and `price`.
Optional fields are `compare_at_price`, `stock`, `status`, `visible`, `image`, and
`description`. A dry run returns row validation without writing. Applying an
upsert is all-or-nothing.

## Inventory

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/inventory` | Last 100 append-only movements |
| `POST` | `/api/inventory` | Product/variant adjustment with location, reference and idempotency key |
| `GET` | `/api/inventory/reservations` | Active/released/committed/expired reservations |
| `POST` | `/api/inventory/reservations` | Reserves available stock without reducing on-hand |
| `PATCH` | `/api/inventory/reservations/:id` | `released` or `committed` |

A movement cannot reduce on-hand stock below active reservations. Variant stock
updates recalculate the parent product aggregate inside the same transaction.

## Orders and reports

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/orders` | Paginated admin list with status/channel/date/search filters |
| `POST` | `/api/orders` | Atomic line snapshots, stock deduction and ledger entries |
| `GET/PATCH` | `/api/orders/:id` | Details and validated status transition |
| `GET` | `/api/account/orders` | Current customer's private history |
| `GET` | `/api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` | Revenue, gross profit, AOV, units, daily, products, categories and breakdowns |
| `GET` | `/api/reports/inventory?threshold=5` | On-hand/reserved/available, valuation and low-stock report |
| `GET` | `/api/reports/export?report=sales\|inventory` | CSV report export |
| `GET` | `/api/audit` | Paginated admin audit trail |

Allowed order transitions are `new → paid → packing → shipping → completed`,
with cancellation allowed before completion. Cancellation restores every product
or variant quantity and writes return movements transactionally.

## Cache and consistency

Public storefront products use tagged Next.js Data Cache. Product, order, and
inventory mutations synchronously invalidate affected tags and paths. Admin,
customer, audit, import/export, and report HTTP responses are private/no-store;
the expensive report functions use a 60-second server data cache with the same
mutation tags.
