"use client";

import { useState } from "react";
import Link from "next/link";
import RatingStars from "@/components/ui/rating/RatingStars";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { frShortDate, staffSatisfaction } from "@/lib/mock/beautyandco";
import { TODAY_ISO } from "@/lib/mock/planning";
import type { Member } from "@/lib/mock/staff";
import type { StaffRequest } from "@/lib/mock/rh";
import MemberRequestsPanel, { PendingRequestsBanner } from "./MemberRequestsPanel";
import { SectionCard } from "./ui";

// Onglet « Activité » de la fiche membre — l'état de la personne, pas sa config.
//
// 1. Où en est la propriétaire ? En pilotage : elle ouvre la fiche pour un coup
//    d'œil (« Michelle assure ? sa charge cette semaine ? »), ou elle arrive d'une
//    notification « demande en attente » et doit trancher.
// 2. Ce qui doit sauter aux yeux : s'il y a une demande en attente, le bandeau de
//    décision ; sinon la note de satisfaction client.
// 3. Cas dégradés : caisse / manager (jamais noté·e) → pas de bloc satisfaction ;
//    moins de 4 avis → on ne montre pas de moyenne ; aucun avis / aucun RDV →
//    états vides explicites.

type Notice = { text: string; href?: string; linkLabel?: string };

const fr1 = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Props = {
  member: Member;
  // Demandes de CE membre (avance / congé), tenues en état de session par l'écran.
  requests: StaffRequest[];
  // Rendez-vous non annulés du membre, par jour ISO.
  rdvDays: { date: string; count: number }[];
  onDecideRequest: (id: string, status: "acceptee" | "refusee") => void;
};

export default function MemberActivityPanel({
  member,
  requests,
  rdvDays,
  onDecideRequest,
}: Props) {
  // Message de confirmation après décision — même bandeau sombre que la fiche
  // rendez-vous (pas de lib de toast dans ce projet).
  const [notice, setNotice] = useState<Notice | null>(null);

  const isPractitioner = member.roles.includes("praticienne");
  const sat = isPractitioner ? staffSatisfaction(member.firstName) : null;

  const upcoming = rdvDays
    .filter((d) => d.date >= TODAY_ISO)
    .reduce((n, d) => n + d.count, 0);

  const decide = (id: string, status: "acceptee" | "refusee") => {
    const request = requests.find((r) => r.id === id);
    onDecideRequest(id, status);
    if (!request) return;
    if (status === "refusee") {
      setNotice({ text: "Demande refusée." });
    } else if (request.kind === "avance") {
      setNotice({ text: `Avance accordée — à remettre à ${member.firstName}.` });
    } else {
      // Aucun état global partagé : le congé accepté n'est PAS reporté
      // automatiquement dans Planning, on y renvoie la propriétaire.
      setNotice({
        text: "Congé enregistré. Vérifiez la couverture dans Planning.",
        href: "/equipe/planning",
        linkLabel: "Ouvrir le Planning",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Demande(s) en attente — ce qui doit se traiter en premier. */}
      <PendingRequestsBanner
        requests={requests}
        memberFirstName={member.firstName}
        rdvDays={rdvDays}
        onDecide={decide}
      />

      {notice && (
        <p className="flex flex-wrap items-center gap-2 rounded-box bg-neutral px-5 py-3 text-[15px] font-medium text-neutral-content">
          {notice.text}
          {notice.href && notice.linkLabel && (
            <Link href={notice.href} className="underline hover:no-underline">
              {notice.linkLabel}
            </Link>
          )}
        </p>
      )}

      {isPractitioner && sat && (
        <SatisfactionBlock sat={sat} />
      )}

      <SectionCard
        title="Rendez-vous à venir"
        description="Charge de rendez-vous programmée pour cette collaboratrice."
      >
        {upcoming === 0 ? (
          <p className="text-sm text-base-content/60">
            {isPractitioner
              ? "Aucun rendez-vous programmé pour le moment."
              : "Ce poste ne prend pas de rendez-vous."}
          </p>
        ) : (
          <p className="text-sm text-base-content/80">
            <span className="text-title-sm font-bold text-base-content">{upcoming}</span>{" "}
            rendez-vous à venir.
          </p>
        )}
        <Link
          href="/rendez-vous"
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-secondary"
        >
          Ouvrir les rendez-vous →
        </Link>
      </SectionCard>

      {/* Historique des demandes (avances / congés) et leur suite. */}
      <MemberRequestsPanel requests={requests} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bloc « Satisfaction client » — note + tendance + derniers commentaires */
/* ------------------------------------------------------------------ */

function SatisfactionBlock({
  sat,
}: {
  sat: ReturnType<typeof staffSatisfaction>;
}) {
  const description =
    "Avis laissés par les clientes après une visite avec cette praticienne.";

  if (sat.count === 0) {
    return (
      <SectionCard title="Satisfaction client" description={description}>
        <p className="text-sm text-base-content/60">
          Pas encore d&apos;avis sur les {sat.windowLabel}.
        </p>
      </SectionCard>
    );
  }

  const avg = sat.avg as number;
  const up = sat.trend != null && sat.trend > 0;
  const down = sat.trend != null && sat.trend < 0;

  return (
    <SectionCard title="Satisfaction client" description={description}>
      {sat.lowSample ? (
        <div>
          <p className="text-sm font-medium text-base-content">
            {sat.count} avis sur la période
          </p>
          <p className="mt-0.5 text-xs text-base-content/60">
            Trop peu pour une moyenne fiable — lisez plutôt les commentaires.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-baseline gap-1.5">
            <span className="text-title-sm font-bold leading-none text-base-content">
              {fr1(avg)}
            </span>
            <span className="text-lg font-semibold text-base-content/45">/ 5</span>
          </span>
          <RatingStars value={avg} size="md" />
          {sat.trend != null && sat.trend !== 0 && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                up ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"
              }`}
            >
              {up && <ArrowUpIcon />}
              {down && <ArrowDownIcon />}
              {fr1(Math.abs(sat.trend))} pt
            </span>
          )}
          <span className="text-xs text-base-content/45">
            sur {sat.count} avis · {sat.windowLabel}
          </span>
        </div>
      )}

      {sat.comments.length > 0 && (
        <ul className="mt-5 space-y-3">
          {sat.comments.slice(0, 3).map((c) => (
            <li
              key={c.id}
              className={`rounded-xl border px-4 py-3 ${
                c.rating <= 2 ? "border-error-200 bg-error-50/50" : "border-base-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <RatingStars value={c.rating} size="sm" />
                <span className="text-xs font-medium text-base-content/60">
                  {c.rating}/5
                </span>
              </div>
              <p className="mt-1.5 text-sm text-base-content/80">«&nbsp;{c.comment}&nbsp;»</p>
              <p className="mt-1.5 text-xs text-base-content/45">
                {c.client} · {c.service} · {frShortDate(c.date)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/satisfaction"
        className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-secondary"
      >
        Voir la satisfaction détaillée →
      </Link>
    </SectionCard>
  );
}
