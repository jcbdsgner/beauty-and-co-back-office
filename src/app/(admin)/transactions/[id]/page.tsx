import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import { transactionById, currency, dateTime } from "@/lib/mock";

export const metadata: Metadata = { title: "Transaction detail | Homonyme" };

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txn = transactionById(id);
  if (!txn) notFound();

  return (
    <div>
      <PageHeader
        title={currency(txn.amount)}
        description={`${txn.type} · ${txn.reference}`}
        backHref="/transactions"
        backLabel="Transactions"
      />
      <div className="max-w-xl">
        <DefinitionList
          items={[
            { label: "Status", value: <StatusBadge value={txn.status} /> },
            { label: "Type", value: txn.type },
            { label: "Amount", value: currency(txn.amount) },
            { label: "Method", value: txn.method },
            { label: "Customer", value: txn.customer },
            { label: "Date", value: dateTime(txn.date) },
            { label: "Reference", value: <code className="text-theme-xs">{txn.reference}</code> },
          ]}
        />
      </div>
    </div>
  );
}
