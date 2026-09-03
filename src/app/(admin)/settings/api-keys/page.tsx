import type { Metadata } from "next";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { apiKeys, shortDate, type ApiKey } from "@/lib/mock";

export const metadata: Metadata = { title: "API keys | Homonyme" };

const columns: Column<ApiKey>[] = [
  { key: "label", header: "Label", render: (k) => <span className="font-medium text-gray-800 dark:text-white/90">{k.label}</span> },
  { key: "prefix", header: "Key", render: (k) => <code className="text-theme-xs text-gray-500">{k.prefix}····</code> },
  { key: "scope", header: "Scope" },
  { key: "created", header: "Created", render: (k) => shortDate(k.created) },
  { key: "lastUsed", header: "Last used", render: (k) => shortDate(k.lastUsed) },
  { key: "revoke", header: "", align: "right", render: () => <span className="text-theme-sm text-error-500">Revoke</span> },
];

export default function ApiKeysSettingsPage() {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="cursor-default rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white opacity-90">
          Create key
        </button>
      </div>
      <DataTable columns={columns} rows={apiKeys} rowKey={(k) => k.id} />
    </div>
  );
}
