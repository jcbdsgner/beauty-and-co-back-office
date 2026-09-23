"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { weekSalonSummary } from "@/lib/mock/planning";
import {
  ACCOUNT_LABELS,
  CATEGORY_LABELS,
  ROLE_LABELS,
  fullName,
  initials,
  type AccountState,
  type Member,
  type StaffRole,
} from "@/lib/mock/staff";
import { pendingRequestsForMember, type StaffRequest } from "@/lib/mock/rh";
import { Avatar } from "./ui";

type Props = {
  members: Member[];
  // Demandes de toute l'équipe (état de session) — sert la pastille par carte.
  requests: StaffRequest[];
  onOpen: (id: string) => void;
};

const ACCOUNT_TONE: Record<AccountState, "success" | "info" | "light"> = {
  active: "success",
  invited: "info",
  none: "light",
};

const ROLE_FILTERS: { value: StaffRole | "all"; label: string }[] = [
  { value: "all", label: "Tous les rôles" },
  { value: "praticienne", label: "Praticiennes" },
  { value: "caisse", label: "Caisse" },
  { value: "manager", label: "Managers" },
];

// Grille de cartes membres — remplace l'ancien tableau (2026-09-22, passage
// listes → blocs demandé par l'utilisatrice, même grammaire que
// `ClientCards`, façon répertoire).
export default function EquipeList({ members, requests, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (role !== "all" && !m.roles.includes(role)) return false;
      if (!q) return true;
      return (
        fullName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    });
  }, [members, query, role]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, un e-mail, un téléphone"
            aria-label="Rechercher un membre"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
          />
        </div>
        <SegmentedControl
          options={ROLE_FILTERS}
          value={role}
          onChange={setRole}
          aria-label="Filtrer par rôle"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-theme-sm text-gray-500">
            Aucun membre ne correspond à cette recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((m) => {
            const pending = pendingRequestsForMember(m.id, requests).length;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpen(m.id)}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-theme-xs transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-theme-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Avatar initials={initials(m)} size="sm" />
                  {pending > 0 && (
                    <Badge size="sm" color="warning">
                      {pending === 1 ? "1 demande" : `${pending} demandes`}
                    </Badge>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-800">{fullName(m)}</p>
                  <p className="text-theme-xs text-gray-500">{CATEGORY_LABELS[m.category]}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {m.roles.map((r) => (
                    <Badge key={r} size="sm" color="primary">
                      {ROLE_LABELS[r]}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto space-y-1.5 border-t border-gray-100 pt-3 text-theme-xs">
                  <p className="text-gray-500">{weekSalonSummary(m.id)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge size="sm" color={ACCOUNT_TONE[m.account]}>
                      {ACCOUNT_LABELS[m.account]}
                    </Badge>
                    <span className={m.active ? "text-gray-500" : "text-gray-400"}>
                      {m.active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
