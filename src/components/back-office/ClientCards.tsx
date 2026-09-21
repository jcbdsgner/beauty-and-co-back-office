"use client";

import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { initialsOf } from "@/components/back-office/shared/PersonCard";
import { fcfa, frShortDate, groupThousands, type ClientRow } from "@/lib/mock/beautyandco";
import ClientRowActions from "./ClientRowActions";

// Grille de cartes clientes, façon répertoire de point-de-vente
// (components/clientele/repertoire-view.tsx) — remplace l'ancien tableau
// `ClientsTable`. Ses deux repères mis en avant (cf. CLAUDE.md) : dernière
// visite et total dépensé.

function lastVisitHint(days: number | null): string {
  if (days === null) return "Jamais venue";
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  const months = Math.max(1, Math.round(days / 30));
  return months === 1 ? "il y a 1 mois" : `il y a ${months} mois`;
}

type Props = {
  rows: ClientRow[];
  onDelete: (row: ClientRow) => void;
};

export default function ClientCards({ rows, onDelete }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {rows.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-sm font-semibold text-brand-700">
              {initialsOf(c.name)}
            </span>
            {c.segment === "a-relancer" && (
              <Badge size="sm" color="warning">
                À relancer
              </Badge>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800">{c.name}</p>
            <p className="mt-1 text-theme-xs text-gray-400">Dernière visite</p>
            {c.lastVisit ? (
              <p className="text-theme-sm text-gray-700">
                {frShortDate(c.lastVisit)}{" "}
                <span
                  className={`text-theme-xs ${
                    c.segment === "a-relancer" ? "font-medium text-warning-600" : "text-gray-400"
                  }`}
                >
                  · {lastVisitHint(c.daysSinceLastVisit)}
                </span>
              </p>
            ) : (
              <p className="text-theme-sm text-gray-400">Jamais venue</p>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 pt-3">
            <div>
              <p className="text-theme-xs text-gray-400">Total dépensé</p>
              <p className="text-theme-sm font-semibold tabular-nums text-gray-800">
                {fcfa(c.totalSpent)}
              </p>
            </div>
            <div className="text-end text-theme-xs text-gray-500">
              <p>
                {c.appointments} RDV
                {c.upcoming > 0 && (
                  <span className="font-medium text-brand-500"> · +{c.upcoming}</span>
                )}
              </p>
              <p className="tabular-nums">{groupThousands(c.loyaltyPoints)} pts</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
            <Link
              href={`/clients/${c.id}`}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Détails
            </Link>
            <ClientRowActions clientId={c.id} clientName={c.name} onDelete={() => onDelete(c)} />
          </div>
        </div>
      ))}
    </div>
  );
}
