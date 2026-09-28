"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { weekSalonSummary } from "@/lib/mock/planning";
import {
  ACCOUNT_LABELS,
  memberCategoryLabel,
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

// Métier d'abord (Coiffeurs / Esthéticiens, comme le Planning), puis les autres rôles.
type TeamFilter = "all" | "coiffure" | "esthetique" | Exclude<StaffRole, "praticienne">;
const TEAM_FILTERS: { value: TeamFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "coiffure", label: "Coiffeurs" },
  { value: "esthetique", label: "Esthéticiens" },
  { value: "caisse", label: "Caisse" },
  { value: "manager", label: "Managers" },
  { value: "menage", label: "Ménage" },
];

const matchesFilter = (m: Member, f: TeamFilter) =>
  f === "all" ||
  (f === "coiffure" || f === "esthetique"
    ? m.roles.includes("praticienne") && m.category === f
    : m.roles.includes(f));

// Grille de cartes membres — remplace l'ancien tableau (2026-09-22, passage
// listes → blocs demandé par l'utilisatrice, même grammaire que
// `ClientCards`, façon répertoire).
export default function EquipeList({ members, requests, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TeamFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (!matchesFilter(m, filter)) return false;
      if (!q) return true;
      return (
        fullName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    });
  }, [members, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/45"
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
            className="h-11 w-full rounded-field border border-base-300 bg-white pl-9 pr-4 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
          />
        </div>
        <SegmentedControl
          options={TEAM_FILTERS}
          value={filter}
          onChange={setFilter}
          aria-label="Filtrer par métier ou rôle"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-box border border-base-300 bg-white p-10 text-center">
          <p className="text-sm text-base-content/60">
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
                className="flex flex-col gap-3 rounded-xl border border-base-300 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-theme-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Avatar initials={initials(m)} photo={m.photo} size="sm" />
                  {pending > 0 && (
                    <Badge size="sm" color="warning">
                      {pending === 1 ? "1 demande" : `${pending} demandes`}
                    </Badge>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-base-content">{fullName(m)}</p>
                  <p className="text-xs text-base-content/60">{memberCategoryLabel(m)}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {m.roles.map((r) => (
                    <Badge key={r} size="sm" color="primary">
                      {ROLE_LABELS[r]}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto space-y-1.5 border-t border-base-300 pt-3 text-xs">
                  <p className="text-base-content/60">{weekSalonSummary(m.id)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge size="sm" color={ACCOUNT_TONE[m.account]}>
                      {ACCOUNT_LABELS[m.account]}
                    </Badge>
                    <span className={m.active ? "text-base-content/60" : "text-base-content/45"}>
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
