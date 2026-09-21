"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Avatar } from "@/components/back-office/equipe/ui";
import { frShortDate } from "@/lib/mock/beautyandco";
import { RDV_STATUS_META, fcfa, type RdvRow, type RdvStatus } from "@/lib/mock/rendezvous";

// Vue Liste de /rendez-vous en grille de cartes — reprend le grammaire visuelle
// de l'écran journée de point-de-vente (une carte = un rendez-vous, actions en
// pied de carte), adaptée au back-office : pas d'« Encaisser » (pas de caisse
// ici), remplacé par « Voir les détails » / « Affecter une praticienne ».

const badgeColor: Record<RdvStatus, "info" | "success" | "warning" | "error" | "light"> = {
  "à venir": "info",
  terminé: "light",
  annulé: "error",
  absence: "warning",
};

type SortKey = "date" | "client" | "status" | "total";

const clientInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

// « 09:00 » + 45 → « 09:45 »
const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const MAX_PRESTATIONS_SHOWN = 3;

function RdvCard({ row, onOpen }: { row: RdvRow; onOpen: (id: string) => void }) {
  const meta = RDV_STATUS_META[row.status];
  const shown = row.prestationList.slice(0, MAX_PRESTATIONS_SHOWN);
  const more = row.prestationCount - shown.length;
  const needsAssign = row.pendingAssign > 0 && !row.cancelled;
  const endTime = addMinutes(row.time, row.durationMin);

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 transition ${
        row.cancelled
          ? "border-gray-200 opacity-60"
          : "border-gray-200 hover:border-brand-200 hover:shadow-theme-xs"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(row.id)}
        className="flex flex-1 flex-col items-stretch text-start"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar initials={clientInitials(row.clientName)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-theme-sm font-semibold text-gray-800">{row.clientName}</p>
              <p className="truncate text-theme-xs tabular-nums text-gray-400">{row.clientPhone}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge size="sm" color={badgeColor[row.status]}>
              {meta.label}
            </Badge>
            {row.composition && (
              <span className="text-theme-xs font-medium text-gray-400">{row.composition}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2 text-theme-sm">
          <span className="font-semibold tabular-nums text-gray-800">
            {row.time} – {endTime}
          </span>
          <span className="truncate text-theme-xs text-gray-400">
            {frShortDate(row.date.slice(0, 10))} · {row.salonLabel}
          </span>
        </div>

        <ul className="mt-3 space-y-1">
          {shown.map((name, i) => (
            <li key={i} className="truncate text-theme-sm text-gray-600">
              {name}
            </li>
          ))}
          {more > 0 && (
            <li className="text-theme-xs font-medium text-gray-400">
              +{more} de plus
            </li>
          )}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-theme-xs text-gray-500">
            {needsAssign ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-theme-xs font-medium text-warning-700">
                <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
                À affecter
              </span>
            ) : (
              row.staffLabel
            )}
          </span>
          <span className="font-semibold tabular-nums text-gray-800">{fcfa(row.total)}</span>
        </div>
      </button>

      <div className="mt-3 flex flex-col gap-2">
        {needsAssign && (
          <button
            type="button"
            onClick={() => onOpen(row.id)}
            className="w-full rounded-lg bg-warning-50 px-3 py-2 text-theme-sm font-medium text-warning-700 transition hover:bg-warning-100"
          >
            Affecter une praticienne
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className={`w-full rounded-lg px-3 py-2 text-theme-sm font-medium transition ${
            needsAssign
              ? "text-gray-600 hover:bg-gray-50"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          Voir les détails
        </button>
      </div>
    </div>
  );
}

export default function ListView({
  rows,
  onOpen,
}: {
  rows: RdvRow[];
  onOpen: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let d = 0;
      if (sortKey === "date") d = a.date.localeCompare(b.date);
      else if (sortKey === "client") d = a.clientName.localeCompare(b.clientName, "fr");
      else if (sortKey === "status") d = a.status.localeCompare(b.status, "fr");
      else d = a.total - b.total;
      return asc ? d : -d;
    });
    return copy;
  }, [rows, sortKey, asc]);

  const sortOptions: [SortKey, string][] = [
    ["date", "Date & heure"],
    ["client", "Cliente"],
    ["status", "Statut"],
    ["total", "Total"],
  ];

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-theme-sm text-gray-500">
        Aucun rendez-vous ne correspond à ce filtre.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 text-theme-xs text-gray-400">
        <span className="mr-1 font-medium uppercase tracking-wide">Trier par</span>
        {sortOptions.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => (key === sortKey ? setAsc((v) => !v) : (setSortKey(key), setAsc(true)))}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
              key === sortKey ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {key === sortKey && <span>{asc ? "↑" : "↓"}</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((row) => (
          <RdvCard key={row.id} row={row} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
