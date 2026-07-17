# nexorapro.dev Commerce

**Project 01/10 — Production-Grade Portfolio Series**

Premium electronics storefront and commerce management platform for small and large retailers. nexorapro.dev is designed to manage the full journey from supplier intake and inventory to multilingual publishing, orders, sales analytics, and the customer-facing store.

> Current status: **UI foundation / portfolio development**. The interface uses realistic demo data; persistence, authentication, and payment processing are planned next.

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
| `/` | Premium storefront concept | UI complete |
| `/admin` | Executive commerce dashboard | UI complete |
| `/admin/products` | Search, filters, create draft, language status, visibility | Interactive demo |
| `/admin/sales` | Product selection, cart, discount, payment method, stock deduction | Interactive demo |
| `/admin/inventory` | Inventory module scope | Planned module screen |
| `/admin/orders` | Order management scope | Planned module screen |
| `/admin/analytics` | Extended analytics scope | Planned module screen |
| `/admin/localization` | UZ/RU/EN workflow scope | Planned module screen |

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- shadcn/ui foundation
- TanStack Table
- Recharts
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

## Current limitations

- Product and sales data is shared across admin routes in client memory and resets after refresh.
- Authentication and RBAC are not connected yet.
- Storefront actions are visual only.
- Product artwork is made with CSS placeholders; real product media will use an asset pipeline.
- Analytics values are demo data and not financial records.

## Definition of production-ready for this project

The project will only be marked production-ready after database persistence, RBAC, validation, audit logs, security review, automated tests, observability, backups, deployment, and documented recovery procedures are implemented and verified.

## License

MIT
