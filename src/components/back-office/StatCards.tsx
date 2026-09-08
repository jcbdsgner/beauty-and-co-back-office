import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { Kpi } from "@/lib/mock/beautyandco";

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
            className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
          >
            {/* Zone 1 — libellé */}
            <span className="text-theme-sm text-gray-500">{kpi.label}</span>

            {/* Zone 2 — valeur (toute la largeur) + écart sur sa propre ligne */}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-title-sm font-bold leading-none text-gray-800">
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-lg font-semibold text-gray-400">{kpi.unit}</span>
              )}
            </div>

            <div className="mt-2 flex min-h-[1.5rem] items-center gap-2 text-theme-xs">
              {showDelta && (
                <>
                  <span
                    className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                      up
                        ? "bg-success-50 text-success-600"
                        : down
                          ? "bg-error-50 text-error-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {up && <ArrowUpIcon />}
                    {down && <ArrowDownIcon />}
                    {Math.abs(kpi.delta as number)} %
                  </span>
                  {kpi.deltaLabel && <span className="text-gray-400">{kpi.deltaLabel}</span>}
                </>
              )}
            </div>

            {/* Zone 3 — repère de la période précédente, ancré en bas pour aligner les cartes */}
            <div className="mt-auto min-h-[2.5rem] pt-3 text-theme-xs text-gray-400">
              {kpi.hint && <span>{kpi.hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
