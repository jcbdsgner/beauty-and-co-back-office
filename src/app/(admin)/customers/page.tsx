import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { customers, currency, shortDate, type Customer } from "@/lib/mock";

export const metadata: Metadata = { title: "Customers | Homonyme" };

const columns: Column<Customer>[] = [
  {
    key: "name",
    header: "Customer",
    render: (c) => (
      <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
        <Image src={c.avatar} alt={c.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
        <span>
          <span className="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{c.name}</span>
          <span className="block text-theme-xs text-gray-400">{c.email}</span>
        </span>
      </Link>
    ),
  },
  { key: "company", header: "Company" },
  { key: "country", header: "Country" },
  { key: "plan", header: "Plan" },
  { key: "mrr", header: "MRR", align: "right", render: (c) => currency(c.mrr) },
  { key: "lastSeen", header: "Last seen", render: (c) => shortDate(c.lastSeen) },
  { key: "status", header: "Status", render: (c) => <StatusBadge value={c.status} /> },
];

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone with an account or an active subscription."
        action={{ label: "Add customer" }}
      />
      <DataTable columns={columns} rows={customers} rowKey={(c) => c.id} />
    </div>
  );
}
