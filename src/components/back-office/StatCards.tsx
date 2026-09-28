import type { ComponentType } from "react";
import {
  CalendarCheck2,
  Repeat,
  Smile,
  UserPlus,
  Wallet2,
} from "lucide-react";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { Kpi } from "@/lib/mock/beautyandco";

// Icône par indicateur — repère visuel rapide dans un coup d'œil, la carte
// « rendez-vous » reçoit en plus un traitement « hero » (fond teinté marque)
// puisque c'est l'indicateur qui doit sauter aux yeux en premier (priorité
// confirmée par la propriétaire, cf. Dashboard.tsx).
const KPI_ICON: Record<string, ComponentType<{ className?: string }>> = {
  rdv: CalendarCheck2,
  ca: Wallet2,
  clients: UserPlus,
  satisfaction: Smile,
  "recurring-revenue": Repeat,
};

export default function StatCards({
  items,
  columnsClassName = "grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6",
}: {
  items: Kpi[];
  columnsClassName?: string;
}) {
  return (
    <div className={`grid ${columnsClassName}`}>
      {items.map((kpi) => {
        const up = kpi.direction === "up";
        const down = kpi.direction === "down";
        const showDelta = typeof kpi.delta === "number";
        const hero = kpi.key === "rdv";
        const Icon = KPI_ICON[kpi.key];
        return (
          <div
            key={kpi.key}
            className={`flex h-full flex-col rounded-box border p-5 shadow-[var(--shadow-card)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] md:p-6 ${
              hero
                ? "border-brand-100 bg-gradient-to-br from-brand-50 to-white"
                : "border-base-300 bg-white"
            }`}
          >
            {/* Zone 0 — icône de repère */}
            {Icon && (
              <span
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                  hero ? "bg-brand-500 text-white" : "bg-muted text-base-content/60"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
            )}

            {/* Zone 1 — libellé */}
            <span className="text-sm text-base-content/60">{kpi.label}</span>

            {/* Zone 2 — valeur (toute la largeur) + écart sur sa propre ligne.
                `flex-wrap` : si l'unité ne tient pas à côté d'un gros montant
                (ex. « 2.450.000 FCFA » sur une carte étroite), elle passe
                sous la valeur plutôt que de déborder de la carte. */}
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={`text-title-sm font-bold leading-none ${hero ? "text-brand-900" : "text-base-content"}`}
              >
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-lg font-semibold text-base-content/45">{kpi.unit}</span>
              )}
            </div>

            <div className="mt-2 flex min-h-[1.5rem] flex-wrap items-center gap-2 text-xs">
              {showDelta && (
                <>
                  <span
                    className={`flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 font-medium ${
                      up
                        ? "bg-success-50 text-success-600"
                        : down
                          ? "bg-error-50 text-error-600"
                          : "bg-muted text-base-content/70"
                    }`}
                  >
                    {up && <ArrowUpIcon />}
                    {down && <ArrowDownIcon />}
                    {Math.abs(kpi.delta as number)}&nbsp;%
                  </span>
                  {kpi.deltaLabel && <span className="text-base-content/45">{kpi.deltaLabel}</span>}
                </>
              )}
            </div>

            {/* Zone 3 — repère de la période précédente, ancré en bas pour aligner les cartes */}
            <div className="mt-auto min-h-[2.5rem] pt-3 text-xs text-base-content/45">
              {kpi.hint && <span>{kpi.hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
