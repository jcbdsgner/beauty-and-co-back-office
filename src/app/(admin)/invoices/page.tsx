import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { invoices, currency, shortDate, type Invoice } from "@/lib/mock";

export const metadata: Metadata = { title: "Invoices | Homonyme" };

const columns: Column<Invoice>[] = [
  {
    key: "number",
    header: "Invoice",
    render: (i) => (
      <Link href={`/invoices/${i.id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
        {i.number}
      </Link>
    ),
  },
  { key: "customer", header: "Customer" },
  { key: "issued", header: "Issued", render: (i) => shortDate(i.issued) },
  { key: "due", header: "Due", render: (i) => shortDate(i.due) },
  { key: "amount", header: "Amount", align: "right", render: (i) => currency(i.amount) },
  { key: "status", header: "Status", render: (i) => <StatusBadge value={i.status} /> },
];

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices" description="Billing documents issued to customers." action={{ label: "New invoice" }} />
      <DataTable columns={columns} rows={invoices} rowKey={(i) => i.id} />
    </div>
  );
}
