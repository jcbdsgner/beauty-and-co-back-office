"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";
import type { Service, ServiceRow } from "@/lib/mock/services";
import { Toggle } from "./ui";

type Props = {
  rows: ServiceRow[];
  canReorder: boolean;
  onOpen: (id: string) => void;
  onToggleActive: (service: Service, active: boolean) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
};

function Arrow({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {dir === "up" ? (
        <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M10 5v10M5 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function ServicesList({
  rows,
  canReorder,
  onOpen,
  onToggleActive,
  onMove,
  onDelete,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-theme-sm font-medium text-gray-700">
          Aucun service proposé dans ce salon.
        </p>
        <p className="mt-1 text-theme-sm text-gray-500">
          Choisissez « Tous les salons » ou ajoutez un service.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Table>
        <TableHeader className="border-b border-gray-100">
          <TableRow>
            {canReorder && (
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-theme-xs">
                Ordre
              </TableCell>
            )}
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-theme-xs">
              Service
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-end font-medium text-gray-500 text-theme-xs">
              Prestations
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-end font-medium text-gray-500 text-theme-xs">
              Questions
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-theme-xs">
              Salons
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-theme-xs">
              Statut
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-end font-medium text-gray-500 text-theme-xs">
              <span className="sr-only">Actions</span>
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const s = row.service;
            const confirming = confirmId === s.id;
            return (
              <TableRow key={s.id} className="hover:bg-gray-50">
                {canReorder && (
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1 text-gray-400">
                      <button
                        type="button"
                        onClick={() => onMove(s.id, -1)}
                        disabled={i === 0}
                        aria-label={`Monter ${s.name}`}
                        className="rounded p-1 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Arrow dir="up" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(s.id, 1)}
                        disabled={i === rows.length - 1}
                        aria-label={`Descendre ${s.name}`}
                        className="rounded p-1 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Arrow dir="down" />
                      </button>
                    </div>
                  </TableCell>
                )}

                <TableCell className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onOpen(s.id)}
                    className="group flex items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">
                      {s.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 group-hover:text-brand-500">
                          {s.name}
                        </span>
                        {s.active && row.unbookableCount > 0 && (
                          <Badge size="sm" color="warning">
                            Non réservable
                          </Badge>
                        )}
                      </span>
                      {s.description && (
                        <span className="mt-0.5 block max-w-md truncate text-theme-xs text-gray-500">
                          {s.description}
                        </span>
                      )}
                    </span>
                  </button>
                </TableCell>

                <TableCell className="px-5 py-4 text-end text-theme-sm tabular-nums">
                  <span className="text-gray-700">{row.prestationCount}</span>
                  {row.prestationCount > row.activePrestationCount && (
                    <span className="mt-0.5 block text-theme-xs text-gray-400">
                      {row.activePrestationCount} active{row.activePrestationCount > 1 ? "s" : ""}
                    </span>
                  )}
                </TableCell>

                <TableCell className="px-5 py-4 text-end text-gray-700 text-theme-sm tabular-nums">
                  {row.questionCount}
                </TableCell>

                <TableCell className="px-5 py-4">
                  {row.salonLabels.length === 0 ? (
                    <span className="text-theme-xs text-warning-600">Aucun salon</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.salonLabels.map((name) => (
                        <Badge key={name} size="sm" color="light">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>

                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={s.active}
                      onChange={(v) => onToggleActive(s, v)}
                      aria-label={`Service ${s.name} ${s.active ? "actif" : "inactif"}`}
                    />
                    <span className={`text-theme-xs ${s.active ? "text-gray-600" : "text-gray-400"}`}>
                      {s.active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4 text-end">
                  {confirming ? (
                    <div className="flex items-center justify-end gap-2 text-theme-xs">
                      <span className="text-gray-500">Supprimer ? Prestations détachées.</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(s.id);
                          setConfirmId(null);
                        }}
                        className="font-semibold text-error-600 hover:underline"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="font-medium text-gray-500 hover:underline"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen(s.id)}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(s.id)}
                        aria-label={`Supprimer le service ${s.name}`}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
