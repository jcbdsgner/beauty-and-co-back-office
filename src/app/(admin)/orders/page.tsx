import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { orders, currency, dateTime, type Order } from "@/lib/mock";

export const metadata: Metadata = { title: "Orders | Homonyme" };

const columns: Column<Order>[] = [
  {
    key: "number",
    header: "Order",
    render: (o) => (
      <Link href={`/orders/${o.id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
        {o.number}
      </Link>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    render: (o) => (
      <span>
        <span className="block text-gray-800 dark:text-white/90">{o.customer}</span>
        <span className="block text-theme-xs text-gray-400">{o.email}</span>
      </span>
    ),
  },
  { key: "date", header: "Date", render: (o) => dateTime(o.date) },
  { key: "items", header: "Items", render: (o) => o.items.reduce((n, i) => n + i.qty, 0) },
  { key: "payment", header: "Payment" },
  { key: "fulfillment", header: "Fulfillment", render: (o) => <StatusBadge value={o.fulfillment} /> },
  { key: "total", header: "Total", align: "right", render: (o) => currency(o.total) },
  { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
];

export default function OrdersPage() {
  return (
    <div>
      <PageHeader
        title="Orders"
        description="All orders placed through the storefront and admin."
        action={{ label: "Create order" }}
      />
      <DataTable columns={columns} rows={orders} rowKey={(o) => o.id} />
    </div>
  );
}
