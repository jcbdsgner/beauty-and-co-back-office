"use client";

import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { Bell, CalendarClock, CalendarX2, Check, Package, Palmtree, TicketPercent, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/atoms/button";
import { Switch } from "@/components/ui/atoms/switch";
import { useNotifications } from "@/context/NotificationsContext";
import { fcfa } from "@/lib/mock/beautyandco";
import { leaveDays, leaveRange, staffRequests } from "@/lib/mock/rh";
import { fullName, memberById } from "@/lib/mock/staff";
import type { AppNotification } from "@/lib/mock/notifications";
import { remises, remiseNotificationId, type Remise } from "@/lib/mock/remises";
import RemiseDialog from "@/components/back-office/dashboard/RemiseDialog";
import { visitSalon, type TodayVisit } from "@/components/back-office/dashboard/today";

// « À régler aujourd'hui » — la file de décisions qui ouvre l'accueil.
// Chaque ligne est une phrase dont la personne est le sujet (plus de nom en
// pastille), avec UN bouton qui dit honnêtement ce qu'il fait : on n'affiche
// plus « Valider » / « Refuser » / « Commander » quand le clic ne fait
// qu'ouvrir la fiche où la décision se prend réellement.

type Tone = "urgent" | "team" | "neutral";

// Familles d'alertes que la propriétaire peut masquer d'un interrupteur. Les
// alertes hors famille (paiement, avis…) restent toujours visibles.
type DecisionKind = "remise" | "stock" | "rendez-vous" | "equipe" | "autre";
type FilterKind = Exclude<DecisionKind, "autre">;

const FILTERS: { kind: FilterKind; label: string }[] = [
  { kind: "remise", label: "Remises" },
  { kind: "stock", label: "Stock" },
  { kind: "rendez-vous", label: "Rendez-vous" },
  { kind: "equipe", label: "Équipe" },
];

export type Decision = {
  key: string;
  kind: DecisionKind;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  sentence: ReactNode;
  context: string;
  cta: string;
  href: string;
  notificationId?: string;
  // Remise accordée à la caisse : le bouton ouvre son détail sur place au
  // lieu de naviguer.
  remise?: Remise;
};

const TONE_ICON: Record<Tone, string> = {
  urgent: "bg-warning-50 text-warning-700",
  team: "bg-accent text-secondary",
  neutral: "bg-base-200 text-base-content/70",
};

// Les praticiennes sont affectées automatiquement : ne remonte ici que le
// conflit où plus personne ne peut prendre une prestation (absence posée
// après la réservation) — le rendez-vous est à déplacer.
function assignDecisions(visits: TodayVisit[], showSalon: boolean): Decision[] {
  return visits
    .filter((v) => v.phase !== "past" && v.pendingAssign > 0)
    .map((v) => {
      const missing = v.rdv.prestations.filter((p) => p.staff === null).map((p) => p.name);
      return {
        key: `assign-${v.rdv.id}`,
        kind: "rendez-vous",
        icon: CalendarClock,
        tone: "urgent",
        sentence: (
          <>
            <strong className="font-semibold text-base-content">{v.rdv.client.name}</strong>
            <span className="tabular-nums">, {v.start}</span>
          </>
        ),
        context: [
          `${missing.join(", ")} : aucune praticienne disponible`,
          showSalon ? visitSalon(v) : null,
        ]
          .filter(Boolean)
          .join(" · "),
        cta: "Déplacer",
        href: `/rendez-vous/${v.rdv.id}`,
      } satisfies Decision;
    });
}

// Demandes de l'équipe, stock, et toute autre alerte non lue qui appelle un geste.
function notificationDecisions(list: AppNotification[]): Decision[] {
  return list
    .filter((n) => !n.read && (n.tone === "warning" || n.tone === "error"))
    .map((n): Decision => {
      const request =
        n.category === "equipe" ? staffRequests.find((r) => `notif-${r.id}` === n.id) : undefined;
      const member = request ? memberById(request.memberId) : undefined;
      if (request && member) {
        const who = <strong className="font-semibold text-base-content">{fullName(member)}</strong>;
        if (request.kind === "conge" && request.from && request.to) {
          const days = leaveDays(request.from, request.to);
          return {
            key: n.id,
            kind: "equipe",
            icon: Palmtree,
            tone: "team",
            sentence: (
              <>
                {who} demande {days} jour{days > 1 ? "s" : ""} de congé
              </>
            ),
            context: [leaveRange(request.from, request.to), request.note].filter(Boolean).join(" · "),
            cta: "Examiner",
            href: n.href,
            notificationId: n.id,
          };
        }
        return {
          key: n.id,
          kind: "equipe",
          icon: Wallet,
          tone: "team",
          sentence: (
            <>
              {who} demande une avance de {fcfa(request.amountFcfa ?? 0)}
            </>
          ),
          context: request.note ?? "Avance sur salaire",
          cta: "Examiner",
          href: n.href,
          notificationId: n.id,
        };
      }
      const remise = remises.find((r) => remiseNotificationId(r.id) === n.id);
      if (remise) {
        return {
          key: n.id,
          kind: "remise",
          icon: TicketPercent,
          tone: "urgent",
          sentence: (
            <>
              Remise de <span className="tabular-nums">{fcfa(remise.amountFcfa)}</span> accordée à{" "}
              <strong className="font-semibold text-base-content">{remise.clientName}</strong>
            </>
          ),
          context: `Par ${remise.cashierName} · ${remise.reason}`,
          cta: "Voir plus",
          href: n.href,
          notificationId: n.id,
          remise,
        };
      }
      if (n.category === "rendez-vous" && n.title === "Rendez-vous annulé") {
        const [who, ...rest] = n.body.split(" — ");
        return {
          key: n.id,
          kind: "rendez-vous",
          icon: CalendarX2,
          tone: "urgent",
          sentence: (
            <>
              <strong className="font-semibold text-base-content">{who}</strong> a annulé son
              rendez-vous
            </>
          ),
          context: rest.join(" — "),
          cta: "Voir",
          href: n.href,
          notificationId: n.id,
        };
      }
      if (n.category === "stock") {
        return {
          key: n.id,
          kind: "stock",
          icon: Package,
          tone: "neutral",
          sentence: <strong className="font-semibold text-base-content">{n.title}</strong>,
          context: n.body.replace(/ — .*$/, ""),
          cta: "Voir le stock",
          href: n.href,
          notificationId: n.id,
        };
      }
      return {
        key: n.id,
        kind: "autre",
        icon: Bell,
        tone: "neutral",
        sentence: <strong className="font-semibold text-base-content">{n.title}</strong>,
        context: n.body,
        cta: "Ouvrir",
        href: n.href,
        notificationId: n.id,
      };
    });
}

export function useDayDecisions(visits: TodayVisit[], showSalon: boolean) {
  const { notifications, markRead } = useNotifications();
  const decisions = [...assignDecisions(visits, showSalon), ...notificationDecisions(notifications)];
  return { decisions, markRead };
}

export default function DayDecisions({
  decisions,
  onOpen,
}: {
  decisions: Decision[];
  onOpen: (notificationId: string) => void;
}) {
  // La remise ouverte reste affichée même une fois sa ligne retirée de la file
  // (marquée lue à la fermeture).
  const [openRemise, setOpenRemise] = useState<{ remise: Remise; notificationId?: string } | null>(null);
  const [shown, setShown] = useState<Record<FilterKind, boolean>>({
    remise: true,
    stock: true,
    "rendez-vous": true,
    equipe: true,
  });
  const visible = decisions.filter((d) => d.kind === "autre" || shown[d.kind]);
  const hidden = decisions.length - visible.length;
  const countOf = (kind: FilterKind) => decisions.filter((d) => d.kind === kind).length;

  return (
    <section
      aria-labelledby="decisions-title"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      <header className="px-6 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="decisions-title" className="text-[20px] font-semibold text-base-content">
            {visible.length === 0 ? (
              "Aucune demande à traiter"
            ) : (
              <>
                <span className="tabular-nums">{visible.length}</span> demande
                {visible.length > 1 ? "s" : ""} à traiter
              </>
            )}
          </h2>
          {hidden > 0 && (
            <span className="text-sm tabular-nums text-base-content/60">
              {hidden} masquée{hidden > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div role="group" aria-label="Alertes affichées" className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {FILTERS.map(({ kind, label }) => (
            <div key={kind} className="flex items-center gap-2 text-sm text-base-content/70">
              <Switch
                checked={shown[kind]}
                onChange={(v) => setShown((prev) => ({ ...prev, [kind]: v }))}
                label={`Afficher les alertes ${label.toLowerCase()}`}
                className="size-auto"
              />
              <span aria-hidden>{label}</span>
              <span aria-hidden className="tabular-nums text-base-content/45">{countOf(kind)}</span>
            </div>
          ))}
        </div>
      </header>

      {decisions.length === 0 ? (
        <div className="flex items-start gap-4 border-t border-base-300 px-6 py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700">
            <Check className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-base-content">Tout est en ordre</p>
            <p className="mt-0.5 text-sm text-base-content/60">
              Les rendez-vous annulés ou qu&apos;aucune praticienne ne peut assurer, les remises
              accordées à la caisse, les demandes de l&apos;équipe et les alertes de stock
              apparaîtront ici.
            </p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="border-t border-base-300 px-6 py-6 text-sm text-base-content/60">
          {decisions.length > 1
            ? `Les ${decisions.length} demandes en cours sont masquées : réactivez une famille d'alertes ci-dessus pour les voir.`
            : "La demande en cours est masquée : réactivez sa famille d'alertes ci-dessus pour la voir."}
        </p>
      ) : (
        <ul className="divide-y divide-base-300 border-t border-base-300">
          {visible.map((d) => {
            const Icon = d.icon;
            return (
              <li key={d.key} className="flex items-center gap-4 px-6 py-4">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONE_ICON[d.tone]}`}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug text-base-content/80">{d.sentence}</p>
                  {d.context && (
                    <p className="mt-0.5 truncate text-sm text-base-content/60">{d.context}</p>
                  )}
                </div>
                {d.remise ? (
                  <button
                    type="button"
                    onClick={() => setOpenRemise({ remise: d.remise!, notificationId: d.notificationId })}
                    className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}
                  >
                    {d.cta}
                  </button>
                ) : (
                  <Link
                    href={d.href}
                    onClick={() => d.notificationId && onOpen(d.notificationId)}
                    className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}
                  >
                    {d.cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <RemiseDialog
        remise={openRemise?.remise ?? null}
        onClose={() => {
          if (openRemise?.notificationId) onOpen(openRemise.notificationId);
          setOpenRemise(null);
        }}
      />
    </section>
  );
}
