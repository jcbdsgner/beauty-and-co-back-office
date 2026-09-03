import type { Metadata } from "next";
import DefinitionList from "@/components/back-office/DefinitionList";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { invoices, currency, shortDate, type Invoice } from "@/lib/mock";

export const metadata: Metadata = { title: "Billing settings | Homonyme" };

const columns: Column<Invoice>[] = [
  { key: "number", header: "Invoice" },
  { key: "issued", header: "Date", render: (i) => shortDate(i.issued) },
  { key: "amount", header: "Amount", align: "right", render: (i) => currency(i.amount) },
  { key: "status", header: "Status", render: (i) => <StatusBadge value={i.status} /> },
];

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <DefinitionList
        title="Current plan"
        items={[
          { label: "Plan", value: "Enterprise" },
          { label: "Seats", value: "6 of 25" },
          { label: "Billing cycle", value: "Annual" },
          { label: "Next invoice", value: `${currency(24000)} on ${shortDate("2025-12-01")}` },
        ]}
      />
      <DefinitionList
        title="Payment method"
        items={[
          { label: "Card", value: "Visa ···· 4242" },
          { label: "Expires", value: "08 / 2027" },
          { label: "Billing email", value: "finance@homonyme.app" },
        ]}
      />
      <div>
        <h3 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">Invoice history</h3>
        <DataTable columns={columns} rows={invoices} rowKey={(i) => i.id} />
      </div>
    </div>
  );
}
