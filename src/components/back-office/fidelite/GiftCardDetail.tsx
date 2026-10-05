"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, Clock, MapPin, Printer, Store, Truck } from "lucide-react";
import DetailModal from "../detail/DetailModal";
import { fcfa, frLongDate, salons } from "@/lib/mock/beautyandco";
import {
  balanceOf,
  CHANNEL_LABELS,
  expiresAt,
  frDayShort,
  frStamp,
  giftCardPrestations,
  isExpired,
  usedAmount,
  type GiftCard,
  type GiftCardPerson,
} from "@/lib/mock/cartes-cadeaux";
import { cn } from "@/lib/utils";
import { btnOutline, btnPrimary } from "./ui";

const salonLabel = (id: string) => salons.find((s) => s.id === id)?.name ?? id;

function Person({ label, person }: { label: string; person: GiftCardPerson }) {
  const contact = person.email ?? person.phone;
  return (
    <div className="min-w-0">
      <dt className="text-sm text-base-content/55">{label}</dt>
      <dd className="mt-1">
        {person.clientId ? (
          <Link
            href={`/clients/${person.clientId}`}
            className="group inline-flex items-center gap-1 text-[16px] font-semibold text-base-content"
          >
            <span className="underline-offset-4 group-hover:underline">{person.name}</span>
            <ArrowUpRight aria-hidden className="size-4 text-secondary" />
          </Link>
        ) : (
          <span className="text-[16px] font-semibold text-base-content">{person.name}</span>
        )}
        <p className="truncate text-sm text-base-content/60">
          {person.clientId ? "Cliente du fichier" : "Hors fichier"}
          {contact ? ` · ${contact}` : ""}
        </p>
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-base-300 pt-5">
      <h3 className="mb-3 text-[15px] font-semibold text-base-content">{title}</h3>
      {children}
    </section>
  );
}

/** Étapes d'une carte physique (termes de point-de-vente) : commandée → imprimée → remise / expédiée. */
function Steps({ card }: { card: Extract<GiftCard, { format: "physique" }> }) {
  const p = card.physical;
  const order = ["a-preparer", "prete", "remise"] as const;
  const at = order.indexOf(p.step);
  const steps = [
    { label: "Commandée", date: card.purchasedAt },
    { label: "Imprimée", date: p.readyAt },
    { label: p.mode === "retrait" ? "Remise" : "Expédiée", date: p.handedAt },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const done = i === 0 || i <= at;
        const current = i === at + 1 && p.step !== "remise";
        return (
          <li key={s.label} className="flex flex-col gap-2">
            <span
              className={cn(
                "h-1.5 rounded-full",
                done ? "bg-primary" : current ? "bg-[#e9d4d0]" : "bg-base-300",
              )}
            />
            <span className={cn("text-sm font-semibold", done ? "text-base-content" : "text-base-content/50")}>
              {s.label}
            </span>
            <span className="-mt-1.5 text-sm text-base-content/55">
              {s.date ? frDayShort(s.date) : current ? "En attente" : "—"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function GiftCardDetail({
  card,
  today,
  onClose,
  onResend,
  onAdvance,
}: {
  card: GiftCard;
  today: string;
  onClose: () => void;
  onResend: (to: string) => void;
  onAdvance: () => void;
}) {
  const balance = balanceOf(card);
  const used = usedAmount(card);
  const expired = isExpired(card, today);
  const prestations = giftCardPrestations(card);
  const usedCount = prestations.filter((p) => p.used).length;
  const [to, setTo] = useState(card.format === "digitale" ? card.digital.to : "");

  return (
    <DetailModal title={`Carte cadeau ${card.format === "digitale" ? "digitale" : "physique"}`} onClose={onClose} widthClassName="max-w-2xl">
      <div className="space-y-6">
        {/* En-tête façon point-de-vente : le n° de carte, puis ce qu'elle offre. */}
        <div>
          <h3 className="font-mono text-[24px] leading-tight font-semibold tracking-wide break-all text-base-content">
            {card.code}
          </h3>
          {card.kind === "montant" ? (
            <p className="mt-1 text-[17px] font-semibold tabular-nums text-primary">{fcfa(card.amountFcfa)}</p>
          ) : (
            <p className="mt-1 text-[17px] leading-snug font-semibold text-primary">
              {prestations.map((p) => p.name).join(" · ")}
            </p>
          )}
          <p className="mt-1 text-sm text-base-content/60">
            Carte {card.kind === "montant" ? "montant" : "prestations"} · commandée le {frLongDate(card.purchasedAt)}{" "}
            {card.soldAt === "en-ligne" ? "en ligne" : `au salon ${salonLabel(card.soldAt)}`}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-base-300 pt-5">
          <Person label="Acheteur" person={card.buyer} />
          {card.recipient.name !== card.buyer.name && <Person label="Destinataire" person={card.recipient} />}
          {card.message && (
            <blockquote className="col-span-2 rounded-box bg-base-200 px-4 py-3 text-[15px] text-base-content/80 italic">
              « {card.message} »
            </blockquote>
          )}
        </dl>

        <dl className="grid grid-cols-2 gap-6 border-t border-base-300 pt-5">
          <div>
            {card.kind === "montant" ? (
              <>
                <dt className="text-sm text-base-content/55">Solde</dt>
                <dd className={cn("text-[24px] leading-tight font-semibold tabular-nums", balance === 0 || expired ? "text-base-content/45" : "text-base-content")}>
                  {fcfa(balance)}
                </dd>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-300" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(balance / card.amountFcfa) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-sm text-base-content/60">
                  {used > 0 ? `${fcfa(used)} utilisés sur ${fcfa(card.amountFcfa)}` : "Pas encore utilisée"}
                </p>
              </>
            ) : (
              <>
                <dt className="text-sm text-base-content/55">Prestations</dt>
                <dd className="mt-1">
                  <ul className="space-y-1.5">
                    {prestations.map((p) => (
                      <li key={p.id} className="flex items-start gap-2 text-[15px]">
                        <Check
                          aria-hidden
                          className={cn("mt-0.5 size-4 shrink-0", p.used ? "text-success" : "text-base-content/20")}
                        />
                        <span className={p.used ? "text-base-content/50 line-through" : "font-medium text-base-content"}>
                          {p.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-base-content/60">
                    {usedCount === 0
                      ? "Aucune utilisée"
                      : `${usedCount} sur ${prestations.length} utilisée${usedCount > 1 ? "s" : ""}`}
                  </p>
                </dd>
              </>
            )}
          </div>
          <div>
            <dt className="text-sm text-base-content/55">Validité</dt>
            <dd className={cn("text-[15px] font-medium", expired ? "text-error" : "text-base-content")}>
              {expired ? "Expirée le " : "Jusqu'au "}
              {frLongDate(expiresAt(card))}
            </dd>
          </div>
        </dl>

        {card.format === "digitale" ? (
          <Section title="Envoi">
            {card.digital.status === "echec" ? (
              <div className="rounded-box border border-error/30 bg-error/5 p-4">
                <p className="flex items-start gap-2 text-[15px] font-semibold text-error">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                  La carte n&apos;est pas arrivée
                </p>
                <p className="mt-1 pl-6 text-sm text-base-content/70">{card.digital.failure}</p>
                <label className="mt-4 block text-sm font-medium text-base-content/70">
                  {card.digital.channel === "email" ? "Adresse e-mail" : "Numéro WhatsApp"} du destinataire
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="input input-md mt-1.5 w-full bg-base-100 text-[15px]"
                  />
                </label>
                <button
                  type="button"
                  disabled={to.trim().length === 0}
                  onClick={() => onResend(to.trim())}
                  className={cn(btnPrimary, "mt-3")}
                >
                  Renvoyer la carte
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-base-content">
                    {CHANNEL_LABELS[card.digital.channel]} · {card.digital.to}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-base-content/60">
                    {card.digital.status === "programmee" ? (
                      <>
                        <Clock aria-hidden className="size-3.5" /> Partira le {frLongDate(card.digital.scheduledFor)}
                      </>
                    ) : (
                      <>
                        <Check aria-hidden className="size-3.5 text-success" /> Envoyée le {frStamp(card.digital.sentAt!)}
                      </>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => onResend(card.digital.to)} className={btnOutline}>
                  {card.digital.status === "programmee" ? "Envoyer maintenant" : "Renvoyer"}
                </button>
              </div>
            )}
          </Section>
        ) : (
          <Section title={card.physical.mode === "retrait" ? "Retrait au comptoir" : "Adresse de livraison"}>
            <p className="mb-5 flex items-start gap-2 text-[15px] text-base-content">
              {card.physical.mode === "retrait" ? (
                <>
                  <Store aria-hidden className="mt-0.5 size-4 shrink-0 text-base-content/55" />
                  À retirer au salon {salonLabel(card.physical.salonId)}
                </>
              ) : (
                <>
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-base-content/55" />
                  <span>
                    {card.physical.zone} — {card.physical.address}
                    <span className="block text-sm text-base-content/60">
                      Livraison {card.physical.feeFcfa === 0 ? "offerte" : `payée ${fcfa(card.physical.feeFcfa)}`}
                    </span>
                  </span>
                </>
              )}
            </p>
            <Steps card={card} />
            {card.physical.step !== "remise" && (
              <button type="button" onClick={onAdvance} className={cn(btnPrimary, "mt-5 gap-2")}>
                {card.physical.step === "a-preparer" ? (
                  <>
                    <Printer aria-hidden className="size-4" /> Imprimer
                  </>
                ) : card.physical.mode === "retrait" ? (
                  <>Marquer comme remise</>
                ) : (
                  <>
                    <Truck aria-hidden className="size-4" /> Marquer comme expédiée
                  </>
                )}
              </button>
            )}
          </Section>
        )}

        <Section title="Utilisations">
          {card.uses.length === 0 ? (
            <p className="text-[15px] text-base-content/60">Aucune utilisation pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {card.uses.map((u, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-base-content">{u.label}</p>
                    <p className="text-sm text-base-content/60">
                      {frLongDate(u.at)} · {salonLabel(u.salonId)}
                    </p>
                  </div>
                  {/* Carte prestations : jamais de prix affiché (comme point-de-vente). */}
                  {card.kind === "montant" && (
                    <span className="shrink-0 text-[15px] font-semibold tabular-nums text-base-content">
                      −{fcfa(u.amountFcfa)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </DetailModal>
  );
}
