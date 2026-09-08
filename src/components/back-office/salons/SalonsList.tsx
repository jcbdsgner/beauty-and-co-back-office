"use client";

import Badge from "@/components/ui/badge/Badge";
import {
  frShortDate,
  type SalonClosure,
  type SalonConfig,
} from "@/lib/mock/beautyandco";
import { nextClosure, posteSummary, salonOpenState, btnPrimary } from "./ui";

const TODAY_ISO = "2026-09-03";

function StateBadge({ state }: { state: ReturnType<typeof salonOpenState> }) {
  if (state === "inactif") return <Badge size="sm" color="light">Inactif</Badge>;
  if (state === "ferme") return <Badge size="sm" color="warning">Fermé aujourd&apos;hui</Badge>;
  return <Badge size="sm" color="success">Ouvert</Badge>;
}

export default function SalonsList({
  configs,
  closures,
  onOpen,
  onAdd,
}: {
  configs: SalonConfig[];
  closures: SalonClosure[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className={btnPrimary} onClick={onAdd}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Ajouter un salon
        </button>
      </div>

      <ul className="grid gap-4">
        {configs.map((c) => {
          const state = salonOpenState(c, TODAY_ISO, closures);
          const nc = nextClosure(c, TODAY_ISO, closures);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="flex w-full items-start justify-between gap-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-semibold text-gray-800">{c.name}</h2>
                    <StateBadge state={state} />
                  </div>
                  <p className="mt-0.5 text-theme-sm text-gray-500">
                    {c.area} · {c.address}
                  </p>
                  <p className="mt-2 text-theme-sm text-gray-700">{posteSummary(c)}</p>
                  {nc && (
                    <p className="mt-1 text-theme-xs text-gray-400">
                      Prochaine fermeture : {frShortDate(nc.from)}
                      {nc.to !== nc.from ? ` → ${frShortDate(nc.to)}` : ""} — {nc.reason}
                    </p>
                  )}
                </div>
                <span className="shrink-0 pt-1 text-theme-sm font-medium text-brand-600">
                  Ouvrir →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
