"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";
import {
  ACTOR_ROLES,
  ACTOR_ROLE_FILTER_LABELS,
  ACTOR_ROLE_LABELS,
  DOMAIN_LABELS,
  actorInitials,
  filterJournal,
  frDay,
  groupJournalByDay,
  journalClock,
  journalEntries,
  type ActorRole,
  type JournalDomain,
  type JournalEntry,
  type JournalTone,
} from "@/lib/mock/journal";
import JournalPeriodPicker, {
  DEFAULT_JOURNAL_PERIOD,
  type JournalPeriod,
} from "./journal/JournalPeriodPicker";
import {
  BoxCubeIcon,
  CalenderIcon,
  DollarLineIcon,
  DocsIcon,
  GroupIcon,
  ListIcon,
  UserCircleIcon,
} from "@/icons";

// Écran « Journal d'activité » — la trace de ce que l'équipe a fait dans les salons.
//
// 1. Où en est la propriétaire ? En supervision. Deux registres : le coup d'œil
//    quotidien (« rien d'anormal depuis hier ? ») et l'enquête ponctuelle (« qui
//    a remboursé cette cliente, et pourquoi ? »). Elle délègue l'exploitation à
//    Rokhaya (manager) et Awa (caisse) et veut pouvoir vérifier sans avoir à
//    demander. Elle n'est pas développeuse : un journal doit se lire comme un
//    relevé, pas comme des logs.
// 2. Ce qui doit sauter aux yeux : QUI a fait QUOI, QUAND — la ligne se lit d'un
//    trait. Et, dans le lot, les gestes à surveiller (remboursement, annulation
//    d'encaissement, changement de tarif, annulation tardive) se détachent en
//    rouge avec la mention « Action sensible ». Le plus récent en haut, groupé
//    par jour. Vue par défaut : les actions du manager.
// 3. Quand ça se passe mal : aucune action pour ce salon / ce rôle → état vide
//    neutre (ce n'est pas une alerte) ; période ou recherche trop étroite →
//    message + retour à 30 jours ; une collaboratrice partie reste nommée dans
//    l'historique (nom dénormalisé, aucune jointure).

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const ROLE_OPTIONS: SegmentedOption<ActorRole>[] = ACTOR_ROLES.map((r) => ({
  value: r,
  label: ACTOR_ROLE_FILTER_LABELS[r],
}));

const DOMAIN_ICON: Record<JournalDomain, React.ComponentType<{ className?: string }>> = {
  "rendez-vous": CalenderIcon,
  paiement: DollarLineIcon,
  client: GroupIcon,
  equipe: UserCircleIcon,
  stock: BoxCubeIcon,
  parametres: DocsIcon,
};

const TONE_TILE: Record<JournalTone, string> = {
  info: "bg-gray-100 text-gray-500",
  notable: "bg-warning-50 text-warning-600",
  sensitive: "bg-error-50 text-error-600",
};

const TONE_BORDER: Record<JournalTone, string> = {
  info: "border-transparent",
  notable: "border-warning-300",
  sensitive: "border-error-300",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/* --------------------------------------------------------------------- ligne */

function EntryRow({ entry }: { entry: JournalEntry }) {
  const Icon = DOMAIN_ICON[entry.domain];
  const initials = actorInitials(entry.actorName);

  const body = (
    <>
      <span
        className={`pointer-events-none mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[entry.tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-theme-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-semibold text-brand-700">
              {initials}
            </span>
            <span className="font-semibold text-gray-900">{entry.actorName}</span>
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-theme-xs font-medium text-gray-500">
              {ACTOR_ROLE_LABELS[entry.actorRole]}
            </span>
          </p>
          <span className="shrink-0 text-theme-xs text-gray-400">
            {journalClock(entry.at)}
          </span>
        </div>
        <p className="mt-1 text-theme-sm text-gray-700">
          <span className="text-gray-500">{entry.action}</span>
          {" — "}
          <span className="font-medium text-gray-800">{entry.detail}</span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-theme-xs text-gray-400">
          <span>{DOMAIN_LABELS[entry.domain]}</span>
          {entry.tone === "sensitive" && (
            <span className="font-semibold uppercase tracking-wide text-error-500">
              · Action sensible
            </span>
          )}
        </p>
      </div>
    </>
  );

  if (entry.href) {
    return (
      <li
        className={`group relative flex gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-gray-50 ${TONE_BORDER[entry.tone]}`}
      >
        <Link
          href={entry.href}
          aria-label={`${entry.actorName} ${entry.action}`}
          className="absolute inset-0"
        />
        {body}
      </li>
    );
  }

  return (
    <li className={`flex gap-4 border-l-2 px-5 py-4 ${TONE_BORDER[entry.tone]}`}>{body}</li>
  );
}

/* --------------------------------------------------------------- états vides */

function EmptyRole({ role, salonLabel }: { role: ActorRole; salonLabel: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <ListIcon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-gray-800">
        Aucune action de {ACTOR_ROLE_FILTER_LABELS[role].toLowerCase()}
      </h3>
      <p className="mt-1 max-w-sm text-theme-sm text-gray-500">
        Rien n&apos;a encore été enregistré pour ce rôle
        {salonLabel !== "Tous les salons" ? ` à ${salonLabel}` : ""}.
      </p>
    </div>
  );
}

function EmptyFilter({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <ListIcon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-gray-800">
        Aucune action sur cette période
      </h3>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 text-theme-sm font-medium text-brand-700 hover:underline"
      >
        Élargir aux 30 derniers jours
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------- écran */

export default function Journal() {
  const { scope, setScope } = useLocation();
  const [role, setRole] = useState<ActorRole>("manager");
  const [period, setPeriod] = useState<JournalPeriod>(DEFAULT_JOURNAL_PERIOD);
  const [query, setQuery] = useState("");

  const salonLabel =
    scope === "all"
      ? "Tous les salons"
      : (salons.find((s) => s.id === scope)?.name ?? scope);

  // Total pour ce salon + ce rôle, toutes périodes confondues — sert à
  // distinguer « ce rôle n'a jamais rien fait ici » de « rien sur la période ».
  const roleTotal = useMemo(
    () =>
      journalEntries.filter(
        (e) => (scope === "all" || e.salonId === scope) && e.actorRole === role,
      ).length,
    [scope, role],
  );

  const visible = useMemo(
    () =>
      filterJournal(journalEntries, {
        salon: scope,
        role,
        range: { from: period.from, to: period.to },
        query: normalize(query),
      }),
    [scope, role, period, query],
  );

  const groups = useMemo(() => groupJournalByDay(visible), [visible]);

  const periodLabel =
    period.preset === "today"
      ? "aujourd'hui"
      : period.preset === "7j"
        ? "sur 7 jours"
        : period.preset === "30j"
          ? "sur 30 jours"
          : `du ${frDay(period.from)} au ${frDay(period.to)}`;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Journal d'activité"
          description="Tout ce que votre équipe a fait dans les salons — encaissements, rendez-vous, stock, décisions. Choisissez un rôle et une période."
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Salon
            </span>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
            />
          </div>
          <div className="ml-auto">
            <JournalPeriodPicker value={period} onChange={setPeriod} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
            Voir les actions
          </span>
          <SegmentedControl
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            aria-label="Filtrer par rôle"
          />
        </div>
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.04 9.37a6.33 6.33 0 1 1 12.67 0 6.33 6.33 0 0 1-12.67 0ZM9.38 1.54a7.83 7.83 0 1 0 4.98 13.88l2.82 2.82a.75.75 0 1 0 1.06-1.06l-2.82-2.82A7.83 7.83 0 0 0 9.38 1.54Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une personne, une action…"
            aria-label="Rechercher dans le journal"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {roleTotal === 0 ? (
        <EmptyRole role={role} salonLabel={salonLabel} />
      ) : visible.length === 0 ? (
        <EmptyFilter
          onReset={() => {
            setQuery("");
            setPeriod(DEFAULT_JOURNAL_PERIOD);
          }}
        />
      ) : (
        <>
          <p className="text-theme-sm text-gray-500">
            {visible.length} action{visible.length > 1 ? "s" : ""} {periodLabel}
          </p>
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.day}>
                <h2 className="mb-2 px-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                  {g.label}
                </h2>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {g.items.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
