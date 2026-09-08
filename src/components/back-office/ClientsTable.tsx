"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fcfa, frShortDate, groupThousands, type ClientRow } from "@/lib/mock/beautyandco";
import ClientRowActions from "./ClientRowActions";

export type SortKey =
  | "name"
  | "email"
  | "phone"
  | "lastVisit"
  | "totalSpent"
  | "appointments"
  | "loyaltyPoints";

export type SortState = { key: SortKey; dir: "asc" | "desc" };

const COLUMNS: { key: SortKey; header: string; align?: "right" }[] = [
  { key: "name", header: "Nom complet" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Téléphone" },
  { key: "lastVisit", header: "Dernière visite" },
  { key: "totalSpent", header: "Total dépensé", align: "right" },
  { key: "appointments", header: "Rendez-vous", align: "right" },
  { key: "loyaltyPoints", header: "Points", align: "right" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function lastVisitHint(days: number | null): string {
  if (days === null) return "Jamais venue";
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  const months = Math.max(1, Math.round(days / 30));
  return months === 1 ? "il y a 1 mois" : `il y a ${months} mois`;
}

function SortIndicator({ state }: { state?: "asc" | "desc" }) {
  return (
    <span className="ml-1.5 inline-flex flex-col gap-[2px]" aria-hidden="true">
      <svg width="7" height="4" viewBox="0 0 8 5" className={state === "asc" ? "fill-brand-500" : "fill-gray-300"}>
        <path d="M4 0l4 5H0z" />
      </svg>
      <svg width="7" height="4" viewBox="0 0 8 5" className={state === "desc" ? "fill-brand-500" : "fill-gray-300"}>
        <path d="M0 0h8L4 5z" />
      </svg>
    </span>
  );
}

type Props = {
  rows: ClientRow[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onDelete: (row: ClientRow) => void;
};

export default function ClientsTable({ rows, sort, onSort, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-b border-gray-100">
          <TableRow>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              return (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`whitespace-nowrap px-5 py-3 font-medium text-theme-xs ${
                    col.align === "right" ? "text-end" : "text-start"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className={`inline-flex items-center whitespace-nowrap ${
                      active ? "text-gray-700" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {col.header}
                    <SortIndicator state={active ? sort.dir : undefined} />
                  </button>
                </TableCell>
              );
            })}
            <TableCell isHeader className="px-5 py-3 text-end font-medium text-gray-500 text-theme-xs">
              <span className="sr-only">Actions</span>
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100">
          {rows.map((c) => (
            <TableRow key={c.id} className="hover:bg-gray-50">
              <TableCell className="whitespace-nowrap px-5 py-4 text-theme-sm">
                <Link href={`/clients/${c.id}`} className="group flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-700">
                    {initials(c.name)}
                  </span>
                  <span className="font-medium text-gray-800 group-hover:text-brand-700">
                    {c.name}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap px-5 py-4 text-gray-600 text-theme-sm">
                {c.email}
              </TableCell>
              <TableCell className="whitespace-nowrap px-5 py-4 text-gray-600 text-theme-sm tabular-nums">
                {c.phone}
              </TableCell>
              <TableCell className="whitespace-nowrap px-5 py-4 text-theme-sm">
                {c.lastVisit ? (
                  <span className="text-gray-700">{frShortDate(c.lastVisit)}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
                <span
                  className={`mt-0.5 block text-theme-xs ${
                    c.segment === "a-relancer" ? "text-warning-600" : "text-gray-400"
                  }`}
                >
                  {lastVisitHint(c.daysSinceLastVisit)}
                </span>
              </TableCell>
              <TableCell className="px-5 py-4 text-end text-gray-700 text-theme-sm tabular-nums">
                {fcfa(c.totalSpent)}
              </TableCell>
              <TableCell className="px-5 py-4 text-end text-theme-sm tabular-nums">
                <span className="text-gray-700">{c.appointments}</span>
                {c.upcoming > 0 && (
                  <span className="mt-0.5 block text-theme-xs font-medium text-brand-500">
                    +{c.upcoming} à venir
                  </span>
                )}
              </TableCell>
              <TableCell className="px-5 py-4 text-end text-gray-700 text-theme-sm tabular-nums">
                {groupThousands(c.loyaltyPoints)}
              </TableCell>
              <TableCell className="whitespace-nowrap px-5 py-4 text-end text-theme-sm">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/clients/${c.id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Détails
                  </Link>
                  <ClientRowActions
                    clientId={c.id}
                    clientName={c.name}
                    onDelete={() => onDelete(c)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
