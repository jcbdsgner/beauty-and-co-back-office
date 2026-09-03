import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { activity, dateTime, type ActivityEntry } from "@/lib/mock";

export const metadata: Metadata = { title: "Activity log | Homonyme" };

const columns: Column<ActivityEntry>[] = [
  { key: "date", header: "When", render: (a) => dateTime(a.date) },
  { key: "actor", header: "Actor", render: (a) => <span className="font-medium text-gray-800 dark:text-white/90">{a.actor}</span> },
  { key: "action", header: "Action" },
  { key: "target", header: "Target" },
  { key: "ip", header: "IP", render: (a) => <code className="text-theme-xs text-gray-500">{a.ip}</code> },
];

export default function ActivityPage() {
  return (
    <div>
      <PageHeader title="Activity log" description="Every change made in this workspace." action={{ label: "Export" }} />
      <DataTable columns={columns} rows={activity} rowKey={(a) => a.id} />
    </div>
  );
}
