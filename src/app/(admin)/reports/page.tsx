import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { reports, shortDate, type Report } from "@/lib/mock";

export const metadata: Metadata = { title: "Reports | Homonyme" };

const columns: Column<Report>[] = [
  { key: "name", header: "Report", render: (r) => <span className="font-medium text-gray-800 dark:text-white/90">{r.name}</span> },
  { key: "description", header: "Description" },
  { key: "category", header: "Category" },
  { key: "format", header: "Format" },
  { key: "lastRun", header: "Last run", render: (r) => shortDate(r.lastRun) },
  { key: "download", header: "", align: "right", render: () => <span className="text-theme-sm text-brand-500">Download</span> },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Saved report definitions and their latest exports." action={{ label: "New report" }} />
      <DataTable columns={columns} rows={reports} rowKey={(r) => r.id} />
    </div>
  );
}
