import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import { invoiceById, currency, shortDate } from "@/lib/mock";

export const metadata: Metadata = { title: "Invoice detail | Homonyme" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = invoiceById(id);
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader
        title={invoice.number}
        description={`Billed to ${invoice.customer}`}
        backHref="/invoices"
        backLabel="Invoices"
        action={{ label: "Download PDF" }}
      />
      <div className="max-w-xl space-y-6">
        <DefinitionList
          items={[
            { label: "Status", value: <StatusBadge value={invoice.status} /> },
            { label: "Customer", value: invoice.customer },
            { label: "Issued", value: shortDate(invoice.issued) },
            { label: "Due", value: shortDate(invoice.due) },
            { label: "Amount due", value: <strong>{currency(invoice.amount)}</strong> },
          ]}
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Line items, tax breakdown and payment history would render here.
        </div>
      </div>
    </div>
  );
}
