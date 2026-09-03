import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { tickets, dateTime, type Ticket } from "@/lib/mock";

export const metadata: Metadata = { title: "Support | Homonyme" };

const columns: Column<Ticket>[] = [
  {
    key: "subject",
    header: "Subject",
    render: (t) => (
      <Link href={`/support/${t.id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
        {t.subject}
      </Link>
    ),
  },
  { key: "requester", header: "Requester" },
  { key: "channel", header: "Channel" },
  { key: "priority", header: "Priority" },
  { key: "assignee", header: "Assignee" },
  { key: "updatedAt", header: "Updated", render: (t) => dateTime(t.updatedAt) },
  { key: "status", header: "Status", render: (t) => <StatusBadge value={t.status} /> },
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" description="Customer conversations across every channel." action={{ label: "New ticket" }} />
      <DataTable columns={columns} rows={tickets} rowKey={(t) => t.id} />
    </div>
  );
}
