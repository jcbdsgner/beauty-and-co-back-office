# Homonyme — Back office

A **front-end-only** admin dashboard. There is no backend: every table, chart
and detail screen is powered by mock fixtures in [`src/lib/mock/`](src/lib/mock).
It exists as an architecture + screen skeleton to design against.

Built on the [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
free Next.js template, kept close to stock.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run lint
```

## Where things live

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full map. Quick version:

| Area | Path |
| --- | --- |
| Routes / screens | `src/app/(admin)/…` |
| Auth & error screens | `src/app/(full-width-pages)/…` |
| Mock data (the "database") | `src/lib/mock/…` |
| Project components | `src/components/back-office/…` |
| Sidebar navigation config | `src/layout/AppSidebar.tsx` |
| Theme tokens | `src/app/globals.css` |

## Sections

Operations — Dashboard, Analytics, Orders, Products, Customers, Transactions,
Invoices, Support, Calendar.
Workspace — Team & roles, Reports, Activity log, Notifications, Settings
(general / notifications / security / billing / integrations / API keys).

The **TailAdmin reference** group in the sidebar keeps every original template
demo page (forms, tables, charts, UI elements) available while designing.

## License

TailAdmin base is MIT — see [LICENSE](LICENSE).
