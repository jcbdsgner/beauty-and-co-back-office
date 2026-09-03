import type { Metadata } from "next";
import { integrations } from "@/lib/mock";

export const metadata: Metadata = { title: "Integrations | Homonyme" };

export default function IntegrationsSettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {integrations.map((it) => (
        <div key={it.id} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{it.name}</p>
            <p className="text-theme-xs text-gray-400">{it.category}</p>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{it.description}</p>
          </div>
          <button
            className={`cursor-default rounded-lg px-3 py-1.5 text-theme-xs font-medium ${
              it.connected
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                : "border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            {it.connected ? "Connected" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}
