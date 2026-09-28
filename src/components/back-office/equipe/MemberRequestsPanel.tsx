"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { AlertIcon, CalenderIcon, DollarLineIcon } from "@/icons";
import { fcfa, frLongDate } from "@/lib/mock/beautyandco";
import {
  STAFF_REQUEST_LABELS,
  STAFF_REQUEST_STATUS_LABELS,
  leaveDays,
  leaveRange,
  requestSummary,
  requestTitle,
  type StaffRequest,
  type StaffRequestKind,
  type StaffRequestStatus,
} from "@/lib/mock/rh";
import { EmptyList, SectionCard } from "./ui";

// Onglet « Demandes » de la fiche membre + bandeau de décision.
//
// 1. Où en est la propriétaire ? Soit tâche de routine (elle jette un œil à
//    l'historique), soit — cas neuf — elle arrive d'une notification « demande en
//    attente » et doit trancher, vite.
// 2. Ce qui doit sauter aux yeux : s'il y a une demande en attente, le BANDEAU
//    (montant OU dates + mot de la collaboratrice) avec Accepter / Refuser.
// 3. Cas dégradés : aucune demande → « Aucune demande » ; demande déjà traitée →
//    ligne datée + statut ; congé qui chevauche des rendez-vous déjà pris →
//    avertissement chiffré + lien vers Rendez-vous.

const STATUS_TONE: Record<StaffRequestStatus, "warning" | "success" | "error"> = {
  en_attente: "warning",
  acceptee: "success",
  refusee: "error",
};

function KindIcon({ kind, className }: { kind: StaffRequestKind; className?: string }) {
  return kind === "avance" ? (
    <DollarLineIcon className={className} />
  ) : (
    <CalenderIcon className={className} />
  );
}

/* ------------------------------------------------------------------ */
/* Bandeau — une carte de décision par demande en attente             */
/* ------------------------------------------------------------------ */

export function PendingRequestsBanner({
  requests,
  memberFirstName,
  rdvDays,
  onDecide,
}: {
  requests: StaffRequest[];
  memberFirstName: string;
  // Rendez-vous non annulés du membre, par jour ISO — pour l'alerte de conflit.
  rdvDays: { date: string; count: number }[];
  onDecide: (id: string, status: "acceptee" | "refusee") => void;
}) {
  const pending = requests.filter((r) => r.status === "en_attente");
  if (pending.length === 0) return null;

  return (
    <div className="space-y-3">
      {pending.map((request) => (
        <PendingCard
          key={request.id}
          request={request}
          memberFirstName={memberFirstName}
          rdvDays={rdvDays}
          onDecide={onDecide}
        />
      ))}
    </div>
  );
}

function PendingCard({
  request,
  memberFirstName,
  rdvDays,
  onDecide,
}: {
  request: StaffRequest;
  memberFirstName: string;
  rdvDays: { date: string; count: number }[];
  onDecide: (id: string, status: "acceptee" | "refusee") => void;
}) {
  const [confirmRefuse, setConfirmRefuse] = useState(false);

  const isLeave = request.kind === "conge";
  const hasRange = Boolean(request.from && request.to);
  const days = hasRange ? leaveDays(request.from!, request.to!) : 0;

  const conflicts =
    isLeave && hasRange
      ? rdvDays
          .filter((d) => d.date >= request.from! && d.date <= request.to!)
          .reduce((n, d) => n + d.count, 0)
      : 0;

  return (
    <div className="overflow-hidden rounded-box border border-warning-200 bg-warning-50">
      <div className="flex items-stretch gap-6 p-5">
        {/* Contenu de la demande */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-700 [&_svg]:h-5 [&_svg]:w-5">
              <KindIcon kind={request.kind} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-base-content">
                {requestTitle(request.kind)}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-base-content/60">
                <Badge size="sm" variant="solid" color="warning">
                  En attente
                </Badge>
                Déposée le {frLongDate(request.submittedAt.slice(0, 10))}
              </p>
            </div>
          </div>

          {/* Le chiffre de la décision : montant, ou dates + durée */}
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold tabular-nums text-base-content">
              {isLeave && hasRange
                ? leaveRange(request.from!, request.to!)
                : fcfa(request.amountFcfa ?? 0)}
            </span>
            {isLeave && hasRange && (
              <span className="rounded-md bg-warning-100 px-1.5 py-0.5 text-xs font-medium text-warning-700">
                {days} jour{days > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {request.note && (
            <p className="mt-3.5 rounded-lg border border-warning-100 bg-white px-3.5 py-2.5 text-sm text-base-content/70">
              <span className="italic">«&nbsp;{request.note}&nbsp;»</span>
              <span className="text-base-content/45"> — {memberFirstName}</span>
            </p>
          )}

          {conflicts > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning-200 bg-white px-3.5 py-2.5 text-xs text-warning-800">
              <AlertIcon className="mt-px h-4 w-4 shrink-0" />
              <span>
                {memberFirstName} a déjà {conflicts} rendez-vous programmé
                {conflicts > 1 ? "s" : ""} sur cette période.{" "}
                <Link
                  href="/rendez-vous"
                  className="font-semibold text-brand-600 underline hover:text-secondary"
                >
                  Voir les rendez-vous
                </Link>
              </span>
            </p>
          )}
        </div>

        {/* Rail de décision — occupe l'espace à droite */}
        <div className="flex w-44 shrink-0 flex-col justify-center gap-2 border-l border-warning-200 pl-6">
          {confirmRefuse ? (
            <>
              <p className="text-xs font-medium text-base-content/70">
                Refuser cette demande&nbsp;?
              </p>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmRefuse(false);
                    onDecide(request.id, "refusee");
                  }}
                  className="font-semibold text-error-600 hover:underline"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRefuse(false)}
                  className="font-medium text-base-content/60 hover:underline"
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onDecide(request.id, "acceptee")}
                className="btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] disabled:!bg-base-200 disabled:!text-base-content/40 w-full"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => setConfirmRefuse(true)}
                className="btn btn-outline btn-sm normal-case text-[15px] font-semibold border-base-300 text-secondary hover:!bg-base-200 hover:!border-base-300 hover:!text-secondary active:scale-[0.97] w-full"
              >
                Refuser
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet « Demandes » — historique daté                              */
/* ------------------------------------------------------------------ */

export default function MemberRequestsPanel({
  requests,
}: {
  requests: StaffRequest[];
}) {
  const sorted = [...requests].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );

  return (
    <SectionCard
      title="Demandes"
      description="Les avances de salaire et les congés déposés par la collaboratrice, et la suite qui leur a été donnée."
    >
      {sorted.length === 0 ? (
        <EmptyList>Aucune demande pour cette collaboratrice.</EmptyList>
      ) : (
        <ul className="space-y-3">
          {sorted.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-4 rounded-xl border border-base-300 px-4 py-3.5"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base-content/60 [&_svg]:h-4 [&_svg]:w-4">
                <KindIcon kind={r.kind} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-base-content">
                    {STAFF_REQUEST_LABELS[r.kind]}
                  </p>
                  <Badge size="sm" color={STATUS_TONE[r.status]}>
                    {STAFF_REQUEST_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-base-content/70">
                  {requestSummary(r)}
                </p>
                {r.note && (
                  <p className="mt-1.5 text-xs italic text-base-content/60">
                    «&nbsp;{r.note}&nbsp;»
                  </p>
                )}
                <p className="mt-1.5 text-xs text-base-content/45">
                  Déposée le {frLongDate(r.submittedAt.slice(0, 10))}
                  {r.decidedAt
                    ? ` · ${
                        r.status === "acceptee" ? "acceptée" : "refusée"
                      } le ${frLongDate(r.decidedAt.slice(0, 10))}`
                    : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
