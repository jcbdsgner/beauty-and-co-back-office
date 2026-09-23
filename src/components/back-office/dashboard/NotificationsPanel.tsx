"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import {
  BoxCubeIcon,
  CalenderIcon,
  CheckLineIcon,
  DollarLineIcon,
  GroupIcon,
  ShootingStarIcon,
} from "@/icons";
import { useNotifications } from "@/context/NotificationsContext";
import {
  type AppNotification,
  type NotificationCategory,
} from "@/lib/mock/notifications";

// Widget « Actions à traiter » du tableau de bord — restylé le 2026-09-21 sur
// le node Figma 286:296 (voir CLAUDE.md « Refonte dashboard sur Figma »).
// Écart assumé par rapport à l'ancienne version : ne montre plus que les
// actions (non lues, ton warning/error) — l'historique complet « Toutes les
// notifications » de l'ancienne mouture n'a pas d'équivalent dans le mockup
// Figma et a été retiré (rien d'autre dans l'app ne consommait ce flux
// général, cf. CLAUDE.md).

type Filter = "all" | "stock" | "equipe" | "rendez-vous";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "stock", label: "Stock" },
  { value: "equipe", label: "RH" },
  { value: "rendez-vous", label: "RDV" },
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

// Une action « à traiter » : non lue, ton warning/error (le ton porte déjà
// cette information dans le modèle de données, cf. notifications.ts).
function isActionable(n: AppNotification) {
  return !n.read && (n.tone === "warning" || n.tone === "error");
}

const actionBtn =
  "shrink-0 rounded-lg bg-brand-500 px-3.5 py-1.5 text-theme-xs font-semibold text-white hover:bg-brand-600";
const ghostBtn =
  "shrink-0 rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-[#6a6060] hover:text-[#2d2626]";
const softBtn =
  "shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-theme-xs font-semibold text-brand-700 hover:bg-brand-100";

function ActionCard({
  n,
  onMarkRead,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = CATEGORY_ICON[n.category];
  // `requestNotifications()` (rh.ts) formate le corps en « Nom — détail » —
  // on le reparse ici pour afficher le nom en badge, comme le mockup Figma.
  const [equipeName, equipeDetail] =
    n.category === "equipe" && n.body.includes(" — ")
      ? [n.body.slice(0, n.body.indexOf(" — ")), n.body.slice(n.body.indexOf(" — ") + 3)]
      : [null, n.body];
  const isConge = n.category === "equipe" && n.title === "Demande de congé";

  return (
    <li className="rounded-lg border border-[#efe9e8] bg-[#f9f8f8] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[#6a6060]" />
          <p className="text-[13px] font-bold leading-4 text-[#2d2626]">{n.title}</p>
        </div>
        {equipeName ? (
          <span className="shrink-0 rounded-md border border-brand-200 bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
            {equipeName}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] leading-[17.88px] text-[#6a6060]">{equipeDetail}</p>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        {n.category === "stock" && (
          <Link href={n.href} onClick={() => onMarkRead(n.id)} className={softBtn}>
            Commander
          </Link>
        )}
        {isConge && (
          <>
            {/* Ni « Refuser » ni « Valider » ne décide ici : la décision reste
                sur la fiche membre (pas d'état RH partagé entre écrans, cf.
                rh.ts) — les deux ne font qu'y amener directement. */}
            <Link href={n.href} onClick={() => onMarkRead(n.id)} className={ghostBtn}>
              Refuser
            </Link>
            <Link href={n.href} onClick={() => onMarkRead(n.id)} className={actionBtn}>
              Valider
            </Link>
          </>
        )}
        {n.category === "equipe" && !isConge && (
          <Link href={n.href} onClick={() => onMarkRead(n.id)} className={actionBtn}>
            Traiter
          </Link>
        )}
        {n.category === "rendez-vous" && (
          <Link href={n.href} onClick={() => onMarkRead(n.id)} className={actionBtn}>
            Voir
          </Link>
        )}
      </div>
    </li>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <CheckLineIcon className="h-5 w-5" />
      </span>
      <h4 className="mt-3 text-theme-sm font-semibold text-[#2d2626]">Rien à traiter</h4>
      <p className="mt-1 max-w-[220px] text-theme-xs text-[#6a6060]">
        Les alertes de stock et les demandes de l&apos;équipe qui appellent une
        décision s&apos;afficheront ici.
      </p>
    </div>
  );
}

export default function NotificationsPanel() {
  const { notifications, markRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const actionable = useMemo(() => notifications.filter(isActionable), [notifications]);
  const filtered = useMemo(
    () => (filter === "all" ? actionable : actionable.filter((n) => n.category === filter)),
    [actionable, filter],
  );

  return (
    <div className="rounded-xl border border-[#efe9e8] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-[18px] w-[18px] text-[#2d2626]" />
          <h3 className="text-lg font-semibold text-[#2d2626]">Actions à traiter</h3>
        </div>
        {actionable.length > 0 && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error-100 text-[11px] font-bold text-error-800">
            {actionable.length}
          </span>
        )}
      </div>

      {actionable.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Filtrer les actions par domaine"
          className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[#efe9e8] pb-4"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = opt.value === filter;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFilter(opt.value)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
                  active
                    ? "bg-brand-100 text-brand-700"
                    : "text-[#6a6060] hover:text-[#2d2626]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      <div className={actionable.length > 0 ? "mt-4" : ""}>
        {actionable.length === 0 ? (
          <Empty />
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-theme-xs text-[#6a6060]">
            Rien dans «&nbsp;{FILTER_OPTIONS.find((o) => o.value === filter)?.label}
            &nbsp;».
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((n) => (
              <ActionCard key={n.id} n={n} onMarkRead={markRead} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
