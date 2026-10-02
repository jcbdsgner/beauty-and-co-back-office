"use client";

import SalonFilter from "@/components/back-office/shared/SalonFilter";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { inScope, salonName } from "@/lib/mock/beautyandco";
import {
  ACTOR_ROLES,
  ACTOR_ROLE_FILTER_LABELS,
  DOMAIN_LABELS,
  filterJournal,
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
  presetRange,
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
// Le pointage des arrivées / départs, d'abord une 2ᵉ vue de cet écran, vit dans
// Équipe › Pointage depuis le 2026-10-02.
//
// 1. Où en est la propriétaire ? En supervision. Deux registres : le coup d'œil
//    quotidien (« rien d'anormal depuis hier ? ») et l'enquête ponctuelle (« qui
//    a remboursé cette cliente, et pourquoi ? »). Elle délègue l'exploitation à
//    Rokhaya (manager) et Ndiole (caisse) et veut pouvoir vérifier sans avoir à
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
  info: "bg-muted text-base-content/60",
  notable: "bg-warning-50 text-warning-600",
  sensitive: "bg-error-50 text-error-600",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Colonnes d'une ligne : heure · pictogramme du domaine · texte. L'heure mène
// la lecture (un journal se parcourt de haut en bas, dans le temps), le
// pictogramme porte le ton, le texte se lit d'un trait : qui, quoi, sur quoi.
const ROW_GRID = "grid grid-cols-[3.5rem_2.25rem_minmax(0,1fr)] items-start gap-x-4";

/* --------------------------------------------------------------------- ligne */

function EntryRow({ entry }: { entry: JournalEntry }) {
  const Icon = DOMAIN_ICON[entry.domain];
  const sensitive = entry.tone === "sensitive";

  const body = (
    <>
      <time
        dateTime={entry.at}
        className="pt-2 text-sm tabular-nums text-base-content/60"
      >
        {journalClock(entry.at)}
      </time>
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${TONE_TILE[entry.tone]}`}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 max-w-[72ch]">
        <p className="text-[15px] leading-6 text-base-content/70">
          <span className="font-semibold text-base-content">{entry.actorName}</span>{" "}
          {entry.action}
        </p>
        <p className="text-[15px] leading-6 font-medium text-base-content">{entry.detail}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-base-content/60">
          <span>{DOMAIN_LABELS[entry.domain]}</span>
          {sensitive && (
            <span className="rounded-full bg-error-50 px-2 py-px text-xs font-semibold text-error-600">
              Action sensible
            </span>
          )}
        </p>
      </div>
    </>
  );

  const rowClass = `${ROW_GRID} px-5 py-4 ${sensitive ? "bg-error-25" : ""}`;

  if (entry.href) {
    return (
      <li>
        <Link
          href={entry.href}
          className={`${rowClass} transition-colors hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none`}
        >
          {body}
        </Link>
      </li>
    );
  }

  return <li className={rowClass}>{body}</li>;
}

/* --------------------------------------------------------------- états vides */

function EmptyRole({ role, salonLabel }: { role: ActorRole; salonLabel: string }) {
  return (
    <div className="flex flex-col items-center rounded-box border border-base-300 bg-white px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-base-content/45">
        <ListIcon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-base-content">
        Aucune action de {ACTOR_ROLE_FILTER_LABELS[role].toLowerCase()}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-base-content/60">
        Rien n&apos;a encore été enregistré pour ce rôle
        {salonLabel !== "Tous les salons" ? ` à ${salonLabel}` : ""}.
      </p>
    </div>
  );
}

function EmptyFilter({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-box border border-base-300 bg-white px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-base-content/45">
        <ListIcon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-base-content">
        {title}
      </h3>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 text-sm font-medium text-secondary hover:underline"
      >
        {actionLabel}
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

  const salonLabel = salonName(scope);

  // Total pour ce salon + ce rôle, toutes périodes confondues — sert à
  // distinguer « ce rôle n'a jamais rien fait ici » de « rien sur la période ».
  const roleTotal = useMemo(
    () =>
      journalEntries.filter(
        (e) => inScope(scope, e.salonId) && e.actorRole === role,
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

  return (
    <div>
      <PageHeader
        title="Journal d'activité"
        actions={
          <SalonFilter value={scope} onChange={setScope} />
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <SegmentedControl
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
          aria-label="Voir les actions de"
          size="sm"
        />
        {roleTotal > 0 && (
          <div className="relative ml-auto w-80 shrink-0">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/45">
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
              placeholder="Personne, action, cliente…"
              aria-label="Rechercher dans le journal"
              className="h-10 w-full rounded-field border border-base-300 bg-white py-2 pl-10 pr-3 text-sm text-base-content placeholder:text-base-content/45 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        {roleTotal === 0 ? (
          <EmptyRole role={role} salonLabel={salonLabel} />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-6">
              <JournalPeriodPicker value={period} onChange={setPeriod} />
              <p className="shrink-0 text-sm text-base-content/60">
                {visible.length} action{visible.length > 1 ? "s" : ""}
              </p>
            </div>
            {visible.length === 0 ? (
              query.trim() ? (
                <EmptyFilter
                  title={`Aucune action ne correspond à « ${query.trim()} »`}
                  actionLabel="Effacer la recherche"
                  onAction={() => setQuery("")}
                />
              ) : (
                <EmptyFilter
                  title="Aucune action sur cette période"
                  actionLabel="Élargir aux 30 derniers jours"
                  onAction={() => setPeriod(presetRange("30j"))}
                />
              )
            ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.day} aria-labelledby={`day-${g.day}`}>
                  <h2
                    id={`day-${g.day}`}
                    className="mb-2.5 flex items-baseline gap-2 pl-1 text-[17px] font-semibold text-base-content"
                  >
                    {g.label.charAt(0).toUpperCase() + g.label.slice(1)}
                    <span className="text-sm font-normal text-base-content/60">
                      {g.items.length} action{g.items.length > 1 ? "s" : ""}
                    </span>
                  </h2>
                  <ul className="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-white">
                    {g.items.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
