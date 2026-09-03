import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { Kpi } from "@/lib/mock";

export default function StatCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {items.map((kpi) => {
        const positive = kpi.direction === "up";
        return (
          <div
            key={kpi.key}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">{kpi.label}</span>
            <div className="mt-2 flex items-end justify-between">
              <h4 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
                {kpi.value}
              </h4>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-theme-xs font-medium ${
                  positive
                    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                    : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                }`}
              >
                {positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(kpi.delta)}%
              </span>
            </div>
            {kpi.hint && (
              <span className="mt-1 block text-theme-xs text-gray-400 dark:text-gray-500">
                {kpi.hint}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
