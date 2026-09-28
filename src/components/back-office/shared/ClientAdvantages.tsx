"use client";

import { CalendarClock, Gift, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Board, BoardEmpty, Legend } from "./board";
import { fcfa, frLongDate } from "@/lib/mock/beautyandco";
import {
  ABONNEMENT_STATUS_META,
  abonnementSeeds,
  abonnementStatus,
  computeNextDueDate,
  forfaitById,
  packById,
  packPurchaseSeeds,
  packRemainingIds,
  type Abonnement,
  type AbonnementStatus,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import { getPackPrice } from "@/lib/mock/packs";
import { prestationSeeds } from "@/lib/mock/services";
import { allRendezvous } from "@/lib/mock/rendezvous";

// Ce qu'une cliente a payé d'avance — abonnements, packs, carte cadeau —
// présenté comme point-de-vente (`abonnements-packs-board.tsx`, puces
// d'avantages de `appointment-detail-sheet.tsx`), qui fait autorité. Partagé
// par la fiche cliente et la fiche rendez-vous.

const prestationName = (id: string) => prestationSeeds.find((p) => p.id === id)?.name ?? id;

export const clientAbonnements = (clientId: string): Abonnement[] =>
  abonnementSeeds.filter((a) => a.clientId === clientId);
export const clientPacks = (clientId: string): PackPurchase[] =>
  packPurchaseSeeds.filter((p) => p.clientId === clientId);

// La carte cadeau n'est rattachée qu'au rendez-vous qui l'a mobilisée.
export function clientGiftCard(clientId: string) {
  for (const r of allRendezvous()) {
    if (r.client.id !== clientId) continue;
    const card = r.advantages.find((a) => a.kind === "carte-cadeau");
    if (card && card.kind === "carte-cadeau") return { code: card.code, balance: card.balance };
  }
  return null;
}

export const statusOf = (ab: Abonnement): AbonnementStatus => {
  const f = forfaitById(ab.forfaitId);
  return f ? abonnementStatus(ab, f.cycleDays) : "revoked";
};

export const packRemaining = (pp: PackPurchase) => {
  const pack = packById(pp.packId);
  return pack ? packRemainingIds(pp, pack) : [];
};

const STATUS_TEXT: Record<AbonnementStatus, string> = {
  current: "text-success",
  due: "text-warning",
  revoked: "text-base-content/45",
};
export const statusTextClass = (s: AbonnementStatus) => STATUS_TEXT[s];

const STATUS_CLASS: Record<AbonnementStatus, string> = {
  current: "bg-success/12 text-success",
  due: "bg-warning/15 text-warning",
  revoked: "bg-base-200 text-base-content/45",
};

/** Une puce d'avantage (icône, libellé, statut éventuel) — ligne de résumé de la payeuse. */
export function AvantageChip({
  icon,
  children,
  badge,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: { label: string; warning: boolean };
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-base-200 py-1 pr-2.5 pl-2 text-xs font-semibold text-base-content/80 ring-1 ring-inset ring-base-300">
      <span className="text-primary">{icon}</span>
      <span className="tabular-nums">{children}</span>
      {badge && (
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-[11px]",
            badge.warning ? "bg-warning/15 text-warning" : "bg-base-100 text-base-content/60",
          )}
        >
          {badge.label}
        </span>
      )}
    </span>
  );
}

/** Abonnements, packs et carte cadeau d'une cliente, en lecture (bloc de la fiche). */
export function AbonnementsPacksBoard({ clientId }: { clientId: string }) {
  const abonnements = clientAbonnements(clientId);
  const packs = clientPacks(clientId);
  const gift = clientGiftCard(clientId);

  if (abonnements.length === 0 && packs.length === 0 && !gift) {
    return (
      <Board legend="Abonnements & Packs">
        <BoardEmpty title="Aucun abonnement ni pack" hint="Souscription et vente se font depuis Fidélité & abonnements." />
      </Board>
    );
  }

  return (
    <Board legend="Abonnements & Packs">
      <div className="flex flex-col divide-y divide-base-300">
        {abonnements.map((ab) => {
          const forfait = forfaitById(ab.forfaitId);
          if (!forfait) return null;
          const status = statusOf(ab);
          return (
            <div key={ab.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <Legend>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock aria-hidden className="size-3.5" /> Abonnement
                  </span>
                </Legend>
                <span className={cn("rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", STATUS_CLASS[status])}>
                  {ABONNEMENT_STATUS_META[status].label}
                </span>
              </div>
              <p className="font-semibold text-base-content">{forfait.label}</p>
              <p className="text-xs text-base-content/55">
                {forfait.cycleLabel} · {fcfa(forfait.priceFcfa)} / cycle
                {status !== "revoked" && (
                  <>
                    {" "}
                    · {status === "due" ? "échéance passée le" : "prochaine échéance le"}{" "}
                    {frLongDate(computeNextDueDate(ab, forfait.cycleDays))}
                  </>
                )}
                {status === "revoked" && ab.revokedAt && <> · révoqué le {frLongDate(ab.revokedAt)}</>}
              </p>
              <ul className="flex flex-col gap-0.5 text-sm text-base-content/90">
                {forfait.prestationIds.map((id) => {
                  const consumed = ab.redeemedPrestationIds.includes(id) && status === "current";
                  return (
                    <li key={id} className={cn("flex items-center gap-2", consumed && "text-base-content/40")}>
                      <span className={cn("size-1.5 shrink-0 rounded-full", consumed ? "bg-base-300" : "bg-success")} />
                      <span className={cn(consumed && "line-through")}>{prestationName(id)}</span>
                      {consumed && <span className="text-xs uppercase tracking-wide">pris ce cycle</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {packs.map((pp) => {
          const pack = packById(pp.packId);
          if (!pack) return null;
          const remaining = packRemainingIds(pp, pack);
          const used = pack.prestationIds.length - remaining.length;
          return (
            <div key={pp.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <Legend>
                  <span className="inline-flex items-center gap-1.5">
                    <PackageCheck aria-hidden className="size-3.5" /> Pack
                  </span>
                </Legend>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                    remaining.length === 0 ? "bg-base-200 text-base-content/45" : "bg-success/12 text-success",
                  )}
                >
                  {remaining.length === 0 ? "Épuisé" : `${used} / ${pack.prestationIds.length} utilisées`}
                </span>
              </div>
              <p className="font-semibold text-base-content">{pack.label}</p>
              <p className="text-xs text-base-content/55">
                Acheté le {frLongDate(pp.purchasedAt)} · {fcfa(getPackPrice(pack))}
              </p>
              <ul className="flex flex-col gap-0.5 text-sm text-base-content/90">
                {pack.prestationIds.map((id) => {
                  const consumed = pp.redeemedPrestationIds.includes(id);
                  return (
                    <li key={id} className={cn("flex items-center gap-2", consumed && "text-base-content/40")}>
                      <span className={cn("size-1.5 shrink-0 rounded-full", consumed ? "bg-base-300" : "bg-success")} />
                      <span className={cn(consumed && "line-through")}>{prestationName(id)}</span>
                      {consumed && <span className="text-xs uppercase tracking-wide">utilisée</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {gift && (
          <div className="flex flex-col gap-2 p-4">
            <Legend>
              <span className="inline-flex items-center gap-1.5">
                <Gift aria-hidden className="size-3.5" /> Carte cadeau
              </span>
            </Legend>
            <p className="font-semibold tabular-nums text-base-content">{fcfa(gift.balance)} disponibles</p>
            <p className="text-xs text-base-content/55">Code {gift.code}</p>
          </div>
        )}
      </div>
    </Board>
  );
}

/**
 * Prestations d'un rendez-vous que les abonnements / packs de la payeuse
 * couvrent — même règle que `rendezVousCoverage` de point-de-vente : abonnement
 * avant pack (il se recharge au cycle suivant), un seul instrument par
 * prestation, une unité chacune (à prestations identiques, la plus tôt).
 * Clé = id de la ligne du rendez-vous.
 */
export function rdvCoverage(
  payerId: string,
  lines: { id: string; prestationId: string; start: string }[],
): Map<string, string> {
  const out = new Map<string, string>();
  const first = new Map<string, string>();
  for (const l of [...lines].sort((a, b) => a.start.localeCompare(b.start))) {
    if (!first.has(l.prestationId)) first.set(l.prestationId, l.id);
  }
  const claimed = new Set<string>();
  for (const ab of clientAbonnements(payerId)) {
    if (statusOf(ab) !== "current") continue;
    const forfait = forfaitById(ab.forfaitId);
    if (!forfait) continue;
    for (const pid of forfait.prestationIds) {
      if (claimed.has(pid) || ab.redeemedPrestationIds.includes(pid) || !first.has(pid)) continue;
      claimed.add(pid);
      out.set(first.get(pid)!, forfait.label);
    }
  }
  for (const pp of clientPacks(payerId)) {
    const pack = packById(pp.packId);
    if (!pack) continue;
    for (const pid of packRemainingIds(pp, pack)) {
      if (claimed.has(pid) || !first.has(pid)) continue;
      claimed.add(pid);
      out.set(first.get(pid)!, pack.label);
    }
  }
  return out;
}
