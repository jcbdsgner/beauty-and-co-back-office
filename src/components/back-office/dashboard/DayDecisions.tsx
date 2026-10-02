"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  CalendarClock,
  CalendarX2,
  Check,
  Package,
  Palmtree,
  SlidersHorizontal,
  TicketPercent,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/atoms/button";
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

// Familles d'alertes : la liste est regroupée par famille (dans cet ordre), et
// la propriétaire peut en écarter durablement depuis le menu « Affichage ».
// Les alertes hors famille (paiement, avis…) restent toujours visibles.
type DecisionKind = "remise" | "stock" | "rendez-vous" | "equipe" | "autre";
type FilterKind = Exclude<DecisionKind, "autre">;

const GROUPS: { kind: DecisionKind; label: string }[] = [
  { kind: "equipe", label: "Équipe" },
  { kind: "stock", label: "Stock" },
  { kind: "remise", label: "Remises accordées" },
  { kind: "autre", label: "Autres alertes" },
  { kind: "rendez-vous", label: "Rendez-vous" },
];

const FILTERS = GROUPS.filter((g): g is { kind: FilterKind; label: string } => g.kind !== "autre");

// Familles masquées, mémorisées dans le navigateur (préférence d'affichage,
// pas un filtre de passage). Lu via useSyncExternalStore : rendu serveur =
// tout affiché, puis la préférence s'applique à l'hydratation.
const HIDDEN_KEY = "bo.accueil.alertes-masquees";
const HIDDEN_EVENT = "bo:alertes-masquees";

function readHidden(): string {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeHidden(cb: () => void) {
  window.addEventListener(HIDDEN_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(HIDDEN_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function writeHidden(kinds: FilterKind[]) {
  try {
    window.localStorage.setItem(HIDDEN_KEY, kinds.join(","));
  } catch {
    /* pas de persistance possible, sans gravité */
  }
  window.dispatchEvent(new Event(HIDDEN_EVENT));
}

function useHiddenKinds() {
  const raw = useSyncExternalStore(subscribeHidden, readHidden, () => "");
  const hidden = FILTERS.map((f) => f.kind).filter((k) => raw.split(",").includes(k));
  const toggle = (kind: FilterKind) =>
    writeHidden(hidden.includes(kind) ? hidden.filter((k) => k !== kind) : [...hidden, kind]);
  const showAll = () => writeHidden([]);
  return { hidden, toggle, showAll };
}

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
  const { hidden, toggle, showAll } = useHiddenKinds();
  const isShown = (kind: DecisionKind) => kind === "autre" || !hidden.includes(kind as FilterKind);
  const visible = decisions.filter((d) => isShown(d.kind));
  const countOf = (kind: DecisionKind) => decisions.filter((d) => d.kind === kind).length;
  const groups = GROUPS.filter((g) => isShown(g.kind))
    .map((g) => ({ ...g, items: visible.filter((d) => d.kind === g.kind) }))
    .filter((g) => g.items.length > 0);
  // Ce qui est masqué reste signalé : familles écartées qui ont quelque chose en cours.
  const hiddenWithItems = FILTERS.filter((f) => hidden.includes(f.kind) && countOf(f.kind) > 0);
  const hiddenCount = decisions.length - visible.length;

  return (
    <section
      aria-labelledby="decisions-title"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      <header className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
        <h2 id="decisions-title" className="text-[20px] font-semibold whitespace-nowrap text-base-content">
          À régler aujourd&apos;hui
          {visible.length > 0 && (
            <span className="font-normal tabular-nums text-base-content/55"> · {visible.length}</span>
          )}
        </h2>
        <DisplayMenu hidden={hidden} countOf={countOf} onToggle={toggle} onShowAll={showAll} />
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
          Rien à régler parmi les alertes affichées.
        </p>
      ) : (
        <div className="border-t border-base-300">
          {groups.map((g) => (
            <section key={g.kind} aria-labelledby={`decisions-${g.kind}`}>
              <h3
                id={`decisions-${g.kind}`}
                className="bg-base-200 px-6 py-2 text-xs font-semibold tracking-wide text-base-content/60 uppercase"
              >
                {g.label} <span className="tabular-nums text-base-content/45">· {g.items.length}</span>
              </h3>
              <ul className="divide-y divide-base-300">
                {g.items.map((d) => {
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
                          onClick={() =>
                            setOpenRemise({ remise: d.remise!, notificationId: d.notificationId })
                          }
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
            </section>
          ))}
        </div>
      )}

      {hiddenWithItems.length > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-2 border-t border-base-300 px-6 py-3 text-sm text-base-content/60">
          <span>
            Masqué : {hiddenWithItems.map((f) => f.label.toLowerCase()).join(", ")} (
            <span className="tabular-nums">{hiddenCount}</span> élément{hiddenCount > 1 ? "s" : ""})
          </span>
          <button
            type="button"
            onClick={showAll}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Tout afficher
          </button>
        </p>
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

// Menu « Affichage » : cases à cocher des familles affichées sur l'accueil.
// Le menu reste ouvert pendant qu'on coche ; le bouton signale un réglage en
// cours (« 2 masquées ») pour qu'on n'oublie pas le lendemain.
function DisplayMenu({
  hidden,
  countOf,
  onToggle,
  onShowAll,
}: {
  hidden: FilterKind[];
  countOf: (kind: DecisionKind) => number;
  onToggle: (kind: FilterKind) => void;
  onShowAll: () => void;
}) {
  const itemClass =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-field px-3 text-[15px] text-base-content/90 outline-none data-[highlighted]:bg-accent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40";
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        aria-label={hidden.length > 0 ? `Affichage, ${hidden.length} famille${hidden.length > 1 ? "s" : ""} masquée${hidden.length > 1 ? "s" : ""}` : undefined}
        className="inline-flex shrink-0 items-center gap-2 rounded-field px-3 py-2 text-sm font-medium text-base-content/70 outline-none transition hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-base-200"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {/* Réglage en cours : la pastille remplace le libellé pour garder le
            titre sur une ligne. */}
        {hidden.length > 0 ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold tabular-nums text-secondary">
            {hidden.length} masquée{hidden.length > 1 ? "s" : ""}
          </span>
        ) : (
          "Affichage"
        )}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 overflow-hidden rounded-box border border-border bg-popover p-1.5 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.25)]"
        >
          <DropdownMenuPrimitive.Label className="px-3 pt-2 pb-1.5 text-sm font-semibold text-base-content">
            Afficher sur l&apos;accueil
          </DropdownMenuPrimitive.Label>
          {FILTERS.map((f) => {
            const checked = !hidden.includes(f.kind);
            return (
              <DropdownMenuPrimitive.CheckboxItem
                key={f.kind}
                checked={checked}
                onCheckedChange={() => onToggle(f.kind)}
                onSelect={(e) => e.preventDefault()}
                className={itemClass}
              >
                <span
                  aria-hidden
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
                    checked ? "border-primary bg-primary text-primary-content" : "border-base-300 bg-base-100"
                  }`}
                >
                  {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="flex-1">{f.label}</span>
                <span className="tabular-nums text-base-content/45">{countOf(f.kind)}</span>
              </DropdownMenuPrimitive.CheckboxItem>
            );
          })}
          <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-border" />
          <DropdownMenuPrimitive.Item
            disabled={hidden.length === 0}
            onSelect={onShowAll}
            className={itemClass}
          >
            Tout afficher
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
