"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
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

// Bloc « À traiter » du tableau de bord — fusionne l'ancienne alerte stock
// isolée en tête de page avec le flux de notifications (remplace la cloche du
// header et l'ancienne page dédiée /notifications, fusion du 2026-09-14) :
// une seule source de vérité pour « ce qui appelle une décision » comme pour
// « ce qui s'est passé ». La propriétaire est sur le tableau de bord plusieurs
// fois par jour, tout doit être là où elle regarde déjà, pas derrière un clic
// de plus ni éclaté entre deux blocs qui redisent la même chose.

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

// Libellé de l'action attendue, par catégorie — affiché sur les alertes « à
// traiter » pour que le lien dise ce qu'on va y faire, pas juste « Voir ».
const CATEGORY_ACTION_LABEL: Record<NotificationCategory, string> = {
  "rendez-vous": "Voir le rendez-vous",
  paiement: "Voir le paiement",
  stock: "Voir l'inventaire",
  avis: "Voir l'avis",
  equipe: "Traiter la demande",
};

const TONE_TILE: Record<NotificationTone, string> = {
  info: "bg-blue-light-50 text-blue-light-500",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
};

const TONE_CARD: Partial<Record<NotificationTone, string>> = {
  warning: "border-warning-200 bg-warning-50/50",
  error: "border-error-200 bg-error-50/50",
};

const clock = (iso: string) => iso.slice(11, 16);

// Une alerte qui appelle une décision : non lue, ton warning/error. Le ton
// porte déjà cette information dans le modèle de données (cf. notifications.ts)
// — pas besoin d'un objet « alerte » séparé, dupliqué avec la notif d'origine.
function isActionable(n: AppNotification) {
  return !n.read && (n.tone === "warning" || n.tone === "error");
}

function ActionRow({
  n,
  onMarkRead,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = CATEGORY_ICON[n.category];
  return (
    <li className={`rounded-xl border p-3 ${TONE_CARD[n.tone] ?? "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[n.tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-theme-sm font-semibold text-gray-900">{n.title}</p>
            <span className="shrink-0 text-theme-xs text-gray-400">{clock(n.date)}</span>
          </div>
          <p className="mt-0.5 text-theme-xs text-gray-600">{n.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href={n.href}
              onClick={() => onMarkRead(n.id)}
              className="whitespace-nowrap text-theme-xs font-medium text-brand-700 hover:underline"
            >
              {CATEGORY_ACTION_LABEL[n.category]} →
            </Link>
            <button
              type="button"
              onClick={() => onMarkRead(n.id)}
              className="whitespace-nowrap text-theme-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Marquer lu
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

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
      className={`group relative flex gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-gray-50 ${
        n.read ? "border-transparent" : "border-brand-400 bg-brand-50/40"
      }`}
    >
      {/* Toute la ligne est cliquable ; le calque couvre le contenu (rendu
          non-interactif) mais pas le bouton « Lu », qui passe au-dessus. */}
      <Link
        href={n.href}
        onClick={() => onMarkRead(n.id)}
        aria-label={n.title}
        className="absolute inset-0"
      />
      <span
        className={`pointer-events-none mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[n.tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`truncate text-theme-sm ${
              n.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
            }`}
          >
            {n.title}
          </p>
          <span className="shrink-0 text-theme-xs text-gray-400">{clock(n.date)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-theme-xs text-gray-500">{n.body}</p>
      </div>
      {!n.read && (
        <button
          type="button"
          onClick={() => onMarkRead(n.id)}
          className="relative z-10 shrink-0 self-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-theme-xs font-medium text-gray-600 opacity-0 transition-opacity hover:bg-gray-50 focus-visible:opacity-100 group-hover:opacity-100"
        >
          Lu
        </button>
      )}
    </li>
  );
}

function EmptyAll() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <CheckLineIcon className="h-5 w-5" />
      </span>
      <h4 className="mt-3 text-theme-sm font-semibold text-gray-800">Vous êtes à jour</h4>
      <p className="mt-1 max-w-[240px] text-theme-xs text-gray-500">
        Les nouveaux rendez-vous, encaissements, alertes de stock et demandes de
        l&apos;équipe s&apos;afficheront ici.
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
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <BellIcon className="h-5 w-5" />
      </span>
      <h4 className="mt-3 text-theme-sm font-semibold text-gray-800">
        Rien dans «&nbsp;{CATEGORY_LABELS[category]}&nbsp;»
      </h4>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 text-theme-xs font-medium text-brand-700 hover:underline"
      >
        Voir toutes les notifications
      </button>
    </div>
  );
}

export default function NotificationsPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  // Les alertes « à traiter » sont sorties du flux général pour ne pas être
  // affichées deux fois : une fois qu'elles sont lues (ou traitées ailleurs
  // dans l'app), elles rejoignent naturellement l'historique ci-dessous.
  const actionable = useMemo(() => notifications.filter(isActionable), [notifications]);
  const actionableIds = useMemo(() => new Set(actionable.map((n) => n.id)), [actionable]);
  const general = useMemo(
    () => notifications.filter((n) => !actionableIds.has(n.id)),
    [notifications, actionableIds],
  );

  const filtered = useMemo(
    () => (filter === "all" ? general : general.filter((n) => n.category === filter)),
    [general, filter],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const subtitle =
    actionable.length > 0
      ? `${actionable.length} à traiter`
      : unreadCount > 0
        ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
        : "Tout est lu";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <Bell className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">À traiter</h3>
            <p className="mt-0.5 text-theme-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tout marquer lu
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyAll />
      ) : (
        <div className="custom-scrollbar max-h-[640px] flex-1 overflow-y-auto">
          {/* Alertes — ce qui appelle une décision, toujours visible, jamais
              caché derrière un survol : c'est ce qu'elle doit voir en premier. */}
          <div className="px-5 py-4">
            {actionable.length > 0 ? (
              <ul className="space-y-2">
                {actionable.map((n) => (
                  <ActionRow key={n.id} n={n} onMarkRead={markRead} />
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-theme-xs text-gray-500">
                <CheckLineIcon className="h-4 w-4 shrink-0 text-success-600" />
                Rien à traiter pour le moment.
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-5 py-3">
            <h4 className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
              Toutes les notifications
            </h4>
            <SegmentedControl
              size="sm"
              wrap
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
              aria-label="Filtrer les notifications par catégorie"
            />
          </div>

          {general.length === 0 ? (
            <p className="px-5 py-6 text-center text-theme-xs text-gray-400">
              Rien d&apos;autre pour l&apos;instant.
            </p>
          ) : filtered.length === 0 && filter !== "all" ? (
            <EmptyFilter category={filter} onReset={() => setFilter("all")} />
          ) : (
            <div className="pb-2">
              {groups.map((g) => (
                <div key={g.label}>
                  <h4 className="sticky top-0 z-10 bg-white px-5 pb-1.5 pt-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                    {g.label}
                  </h4>
                  <ul className="divide-y divide-gray-100">
                    {g.items.map((n) => (
                      <Row key={n.id} n={n} onMarkRead={markRead} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
