import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { transactions, currency, dateTime, type Transaction } from "@/lib/mock";

export const metadata: Metadata = { title: "Transactions | Homonyme" };

const columns: Column<Transaction>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (t) => (
      <Link href={`/transactions/${t.id}`} className="font-mono text-theme-xs text-gray-800 hover:text-brand-500 dark:text-white/90">
        {t.reference}
      </Link>
    ),
  },
  { key: "date", header: "Date", render: (t) => dateTime(t.date) },
  { key: "customer", header: "Customer" },
  { key: "type", header: "Type" },
  { key: "method", header: "Method" },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (t) => <span className={t.amount < 0 ? "text-error-500" : ""}>{currency(t.amount)}</span>,
  },
  { key: "status", header: "Status", render: (t) => <StatusBadge value={t.status} /> },
];

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader title="Transactions" description="Charges, refunds, payouts and adjustments." action={{ label: "Export" }} />
      <DataTable columns={columns} rows={transactions} rowKey={(t) => t.id} />
    </div>
  );
}
