# Architecture

Front-end-only admin dashboard. **No backend, no database, no auth** — every
screen reads from in-memory fixture data under `src/lib/mock/`. Built on the
[TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) free
Next.js template (kept close to stock: same theme, layout shell, UI components).

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 · ApexCharts · FullCalendar
- Path alias `@/*` → `src/*`

## Folder layout

```
src/
├─ app/
│  ├─ layout.tsx                 root layout (fonts, theme + sidebar providers)
│  ├─ (admin)/                   authenticated shell (sidebar + header), route group
│  │  ├─ layout.tsx              AppSidebar + AppHeader + content container
│  │  ├─ page.tsx                Dashboard  (/)
│  │  ├─ analytics/
│  │  ├─ orders/          + [id]/
│  │  ├─ products/        + [id]/  + categories/
│  │  ├─ customers/       + [id]/
│  │  ├─ transactions/    + [id]/
│  │  ├─ invoices/        + [id]/
│  │  ├─ support/         + [id]/
│  │  ├─ team/            + [id]/  + roles/
│  │  ├─ reports/  activity/  notifications/
│  │  ├─ settings/               nested layout with tab nav
│  │  │  ├─ page.tsx (general)  notifications/  security/
│  │  │  ├─ billing/  integrations/  api-keys/
│  │  ├─ (others-pages)/         TailAdmin demo pages (calendar, profile, blank, forms, tables)
│  │  └─ (ui-elements)/          TailAdmin component showcase (alerts, badges, buttons, …)
│  └─ (full-width-pages)/        no shell
│     ├─ (auth)/                 signin, signup, forgot-password, reset-password
│     └─ (error-pages)/          error-404, error-500, maintenance
├─ components/
│  ├─ back-office/               project-specific building blocks
│  │  ├─ PageHeader.tsx          title + description + back link + action
│  │  ├─ StatCards.tsx           KPI grid
│  │  ├─ DataTable.tsx           generic column-driven table
│  │  ├─ StatusBadge.tsx         maps status strings → Badge colors
│  │  ├─ DefinitionList.tsx      label/value detail panel
│  │  ├─ FormCard.tsx            settings form card + ToggleRow
│  │  └─ SettingsTabs.tsx        settings sub-navigation
│  ├─ auth/  common/  ecommerce/  form/  header/  tables/  ui/  …   (from TailAdmin)
├─ context/                      SidebarContext, ThemeContext (from TailAdmin)
├─ icons/                        SVG icon set (from TailAdmin)
├─ layout/                       AppSidebar (nav config lives here), AppHeader, Backdrop
└─ lib/
   └─ mock/                      ← the entire "data layer"
      ├─ types.ts                shared TS types
      ├─ customers.ts  products.ts  orders.ts  finance.ts  team.ts
      ├─ analytics.ts  system.ts
      └─ index.ts                barrel + currency() / shortDate() / dateTime() helpers
```

## Navigation

Sidebar sections are defined in `src/layout/AppSidebar.tsx` (`menuGroups`):

1. **Operations** — Dashboard, Analytics, Orders, Products, Customers,
   Transactions, Invoices, Support, Calendar
2. **Workspace** — Team, Reports, Activity log, Notifications, Settings
3. **TailAdmin reference** — the untouched template demo pages, kept for
   component reference while designing.

## Conventions

- **List page**: `PageHeader` + `DataTable` fed a `Column[]` config.
- **Detail page**: `async` server component, `await params`, `notFound()` when
  the id is unknown, `PageHeader` with `backHref`, then `DefinitionList` panels.
- All money via `currency()`, all dates via `shortDate()` / `dateTime()`.
- Action buttons are visual only (`cursor-default`, slightly dimmed) — there is
  nothing to submit to.

## What is intentionally missing

Real authentication, data fetching, mutations, pagination, search, and
persistence. This repo is a screen/architecture skeleton to design against.
