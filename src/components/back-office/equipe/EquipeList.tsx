"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { salonName } from "@/lib/mock/beautyandco";
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
  // Demandes de toute l'équipe (état de session) — sert la pastille par ligne.
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

  const columns: Column<Member>[] = [
    {
      key: "member",
      header: "Membre",
      render: (m) => {
        const pending = pendingRequestsForMember(m.id, requests).length;
        return (
          <div className="flex items-center gap-3">
            <Avatar initials={initials(m)} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800">{fullName(m)}</p>
                {pending > 0 && (
                  <Badge size="sm" color="warning">
                    {pending === 1 ? "1 demande" : `${pending} demandes`}
                  </Badge>
                )}
              </div>
              <p className="text-theme-xs text-gray-500">{CATEGORY_LABELS[m.category]}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "roles",
      header: "Rôles",
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.roles.map((r) => (
            <Badge key={r} size="sm" color="primary">
              {ROLE_LABELS[r]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "salons",
      header: "Salons",
      render: (m) => (
        <span className="text-gray-600">
          {m.salonIds.map((s) => salonName(s)).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "account",
      header: "Accès",
      render: (m) => (
        <Badge size="sm" color={ACCOUNT_TONE[m.account]}>
          {ACCOUNT_LABELS[m.account]}
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Statut",
      render: (m) =>
        m.active ? (
          <span className="text-gray-600">Actif</span>
        ) : (
          <span className="text-gray-400">Inactif</span>
        ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (m) => (
        <button
          type="button"
          onClick={() => onOpen(m.id)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          Détails
        </button>
      ),
    },
  ];

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

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        empty={
          query.trim() || role !== "all"
            ? "Aucun membre ne correspond à cette recherche."
            : "Aucun membre dans ce salon."
        }
      />
    </div>
  );
}
