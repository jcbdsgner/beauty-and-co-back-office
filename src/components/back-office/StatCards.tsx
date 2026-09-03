import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { Kpi } from "@/lib/mock";

export default function StatCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {items.map((kpi) => {
        const up = kpi.direction === "up";
        const down = kpi.direction === "down";
        const showDelta = typeof kpi.delta === "number";
        return (
          <div
            key={kpi.key}
            className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
          >
            <span className="text-theme-sm text-gray-500">{kpi.label}</span>
            <div className="mt-2 flex items-end justify-between">
              <h4 className="text-title-sm font-bold text-gray-800">{kpi.value}</h4>
              {showDelta && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-theme-xs font-medium ${
                    up
                      ? "bg-success-50 text-success-600"
                      : down
                        ? "bg-error-50 text-error-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {up && <ArrowUpIcon />}
                  {down && <ArrowDownIcon />}
                  {Math.abs(kpi.delta as number)}%
                </span>
              )}
            </div>
            {kpi.hint && (
              <span className="mt-1 block text-theme-xs text-gray-400">{kpi.hint}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
