"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { buttonVariants } from "@/components/ui/atoms/button";
import { clientNoun, clients, fcfa, salons } from "@/lib/mock/beautyandco";
import { durationLabel, frFullDate, rdvDuration, rdvTotal, rendezvousDetail } from "@/lib/mock/rendezvous";
import { fullName, memberById } from "@/lib/mock/staff";
import type { Remise } from "@/lib/mock/remises";

// Détail d'une remise accordée à la caisse, ouvert depuis « À régler
// aujourd'hui ». Cliente, rendez-vous et auteur sont des liens : la fiche
// s'ouvre en panneau latéral par-dessus l'accueil (routes interceptées), ou
// l'écran Équipe pour l'auteur.

const time = (iso: string) => iso.slice(11, 16).replace(":", "h");

function LinkRow({ label, href, onNavigate, children }: {
  label: string;
  href: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-base-200"
    >
      <span className="w-28 shrink-0 text-sm text-base-content/60">{label}</span>
      <span className="min-w-0 flex-1 text-[15px] text-base-content">{children}</span>
      <ChevronRight className="size-4 shrink-0 text-base-content/40 group-hover:text-base-content/70" aria-hidden />
    </Link>
  );
}

export default function RemiseDialog({ remise, onClose }: { remise: Remise | null; onClose: () => void }) {
  const titleId = useId();
  const rdv = remise ? rendezvousDetail(remise.rdvId) : null;
  const client = remise ? clients("all").find((c) => c.id === remise.clientId) : undefined;
  const cashier = remise ? memberById(remise.cashierId) : undefined;
  const total = rdv ? rdvTotal(rdv) : null;

  return (
    <Dialog open={remise !== null} onClose={onClose} labelledBy={titleId} className="relative max-w-lg">
      {remise && (
        <div>
          <div className="px-5 pt-5 pr-14">
            <div>
              <h2 id={titleId} className="text-[20px] font-semibold text-base-content">
                Remise accordée
              </h2>
              <p className="mt-0.5 text-sm text-base-content/60">
                {frFullDate(remise.at)} à {time(remise.at)} ·{" "}
                {salons.find((s) => s.id === remise.salonId)?.name ?? remise.salonId}
              </p>
            </div>
            <CloseButton onClick={onClose} aria-label="Fermer" />
          </div>

          <div className="mx-5 mt-5 rounded-box bg-base-200 px-5 py-4">
            <p className="text-sm text-base-content/60">Montant de la remise</p>
            <p className="mt-0.5 text-[28px] font-semibold tabular-nums text-base-content">
              −{fcfa(remise.amountFcfa)}
            </p>
            {total !== null && (
              <p className="mt-1 text-sm tabular-nums text-base-content/60">
                {fcfa(total)} → {fcfa(Math.max(0, total - remise.amountFcfa))} à payer
              </p>
            )}
          </div>

          <div className="mx-5 mt-4">
            <p className="text-sm text-base-content/60">Motif</p>
            <p className="mt-0.5 text-[15px] text-base-content">{remise.reason}</p>
          </div>

          <div className="mt-5 divide-y divide-base-300 border-y border-base-300">
            <LinkRow
              label={client ? clientNoun(client.gender).replace(/^./, (c) => c.toUpperCase()) : "Cliente"}
              href={`/clients/${remise.clientId}`}
              onNavigate={onClose}
            >
              <span className="font-medium">{client?.name ?? remise.clientName}</span>
              {client?.phone && <span className="text-base-content/60"> · {client.phone}</span>}
            </LinkRow>
            <LinkRow label="Rendez-vous" href={`/rendez-vous/${remise.rdvId}`} onNavigate={onClose}>
              {rdv ? (
                <>
                  <span className="font-medium tabular-nums">{rdv.date.slice(11, 16)}</span>
                  <span className="text-base-content/70">
                    {" "}· {rdv.prestations.map((p) => p.name).join(", ")}
                  </span>
                  <span className="block text-sm text-base-content/60">
                    {durationLabel(rdvDuration(rdv))} · réf. {rdv.ref}
                  </span>
                </>
              ) : (
                <span className="font-medium">Voir le rendez-vous</span>
              )}
            </LinkRow>
            <LinkRow label="Accordée par" href={`/equipe?membre=${remise.cashierId}`} onNavigate={onClose}>
              <span className="font-medium">{cashier ? fullName(cashier) : remise.cashierName}</span>
              <span className="text-base-content/60"> · Caisse</span>
            </LinkRow>
          </div>

          <div className="flex justify-end px-5 py-4">
            <button type="button" onClick={onClose} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
