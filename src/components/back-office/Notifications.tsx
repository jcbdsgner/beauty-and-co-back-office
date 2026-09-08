"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import {
  BellIcon,
  BoxCubeIcon,
  CalenderIcon,
  CheckLineIcon,
  DollarLineIcon,
  GroupIcon,
  ShootingStarIcon,
} from "@/icons";
import { useNotifications } from "@/context/NotificationsContext";
import {
  CATEGORY_LABELS,
  groupByDay,
  type AppNotification,
  type NotificationCategory,
  type NotificationTone,
} from "@/lib/mock/notifications";

// Écran « Notifications » — la liste complète, derrière la cloche du header.
//
// 1. Où en est la propriétaire ? Elle arrive de la cloche (ou du menu) pour
//    rattraper ce qui s'est passé depuis ce matin / hier soir. Pas une session
//    de fond : un balayage rapide. Elle veut repérer ce qui demande une action
//    (annulation, demande de congé, stock bas), cliquer pour traiter, puis
//    « faire le ménage » (tout marquer lu).
// 2. Ce qui doit sauter aux yeux : les non-lues, groupées par jour, la plus
//    récente en haut ; le nombre de non-lues ; le ton (une annulation ou une
//    demande se distingue d'une simple info).
// 3. Quand ça se passe mal : aucune notification → état vide rassurant
//    (« Vous êtes à jour »), pas d'alarme ; tout est lu → le bouton « Tout
//    marquer lu » est désactivé ; un filtre sans résultat → message propre avec
//    retour à « Toutes » ; une notif ancienne reste cliquable, dans son groupe
//    daté. Chaque notification pointe vers une page qui existe.

type Filter = NotificationCategory | "all";

const FILTER_OPTIONS: SegmentedOption<Filter>[] = [
  { value: "all", label: "Toutes" },
  ...(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((c) => ({
    value: c as Filter,
    label: CATEGORY_LABELS[c],
  })),
];

const CATEGORY_ICON: Record<
  NotificationCategory,
  React.ComponentType<{ className?: string }>
> = {
  "rendez-vous": CalenderIcon,
  paiement: DollarLineIcon,
  stock: BoxCubeIcon,
  avis: ShootingStarIcon,
  equipe: GroupIcon,
};

const TONE_TILE: Record<NotificationTone, string> = {
  info: "bg-blue-light-50 text-blue-light-500",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
};

const clock = (iso: string) => iso.slice(11, 16);

/* ------------------------------------------------------------------ ligne */

function Row({
  n,
  onMarkRead,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = CATEGORY_ICON[n.category];
  return (
    <li
      className={`group relative flex gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-gray-50 ${
        n.read ? "border-transparent" : "border-brand-400 bg-brand-50/40"
      }`}
    >
      {/* Toute la ligne est cliquable ; le calque couvre le contenu (rendu
          non-interactif) mais pas le bouton « Marquer lu », qui passe au-dessus. */}
      <Link
        href={n.href}
        onClick={() => onMarkRead(n.id)}
        aria-label={n.title}
        className="absolute inset-0"
      />
      <span
        className={`pointer-events-none mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[n.tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`truncate text-theme-sm ${
              n.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
            }`}
          >
            {n.title}
          </p>
          <span className="shrink-0 text-theme-xs text-gray-400">{clock(n.date)}</span>
        </div>
        <p className="mt-0.5 text-theme-sm text-gray-500">{n.body}</p>
        <p className="mt-1 text-theme-xs text-gray-400">{CATEGORY_LABELS[n.category]}</p>
      </div>
      {!n.read && (
        <button
          type="button"
          onClick={() => onMarkRead(n.id)}
          className="relative z-10 shrink-0 self-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-600 opacity-0 transition-opacity hover:bg-gray-50 focus-visible:opacity-100 group-hover:opacity-100"
        >
          Marquer lu
        </button>
      )}
    </li>
  );
}

/* -------------------------------------------------------------- états vides */

function EmptyAll() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <CheckLineIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-gray-800">Vous êtes à jour</h3>
      <p className="mt-1 max-w-sm text-theme-sm text-gray-500">
        Aucune notification pour le moment. Les nouveaux rendez-vous, les encaissements, les
        alertes de stock et les demandes de l&apos;équipe s&apos;afficheront ici.
      </p>
    </div>
  );
}

function EmptyFilter({
  category,
  onReset,
}: {
  category: NotificationCategory;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <BellIcon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-gray-800">
        Aucune notification dans «&nbsp;{CATEGORY_LABELS[category]}&nbsp;»
      </h3>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 text-theme-sm font-medium text-brand-700 hover:underline"
      >
        Voir toutes les notifications
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- écran */

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((n) => n.category === filter),
    [notifications, filter],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Notifications"
          description="Tout ce qui s'est passé dans vos salons — rendez-vous, encaissements, stock, avis et demandes de l'équipe."
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
            aria-label="Filtrer par catégorie"
          />
          <div className="ml-auto flex items-center gap-3">
            <span className="text-theme-sm text-gray-500">
              {unreadCount === 0
                ? "Tout est lu"
                : `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckLineIcon className="h-4 w-4" />
              Tout marquer lu
            </button>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyAll />
      ) : filtered.length === 0 && filter !== "all" ? (
        <EmptyFilter category={filter} onReset={() => setFilter("all")} />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                {g.label}
              </h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {g.items.map((n) => (
                  <Row key={n.id} n={n} onMarkRead={markRead} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
