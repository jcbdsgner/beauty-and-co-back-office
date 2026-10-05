"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, Clock, Mail, MapPin, MessageCircle, Printer, Store, Truck } from "lucide-react";
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
import { btnGhost, btnPrimary } from "./ui";

// Fiche d'une carte cadeau (panneau latéral). Ordre de lecture, refonte du
// 2026-10-05 : 1) ce qui attend un geste (envoi en échec, carte à imprimer ou
// à remettre) avec son bouton ; 2) ce qui reste sur la carte et jusqu'à quand ;
// 3) qui l'a offerte, à qui, le message ; 4) l'envoi ou la remise une fois
// faits ; 5) les utilisations, seulement s'il y en a.

const salonLabel = (id: string) => salons.find((s) => s.id === id)?.name ?? id;

type Physical = Extract<GiftCard, { format: "physique" }>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-base-300 pt-6">
      <h3 className="mb-3 text-[15px] font-semibold text-base-content">{title}</h3>
      {children}
    </section>
  );
}

function Person({ label, person }: { label: string; person: GiftCardPerson }) {
  const contact = person.email ?? person.phone;
  return (
    <div className="min-w-0">
      <dt className="text-sm text-base-content/55">{label}</dt>
      <dd className="mt-0.5">
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
        {contact && <p className="truncate text-sm text-base-content/55">{contact}</p>}
      </dd>
    </div>
  );
}

/** Étapes d'une carte physique : commandée → imprimée → remise / expédiée. */
function Steps({ card }: { card: Physical }) {
  const p = card.physical;
  const at = (["a-preparer", "prete", "remise"] as const).indexOf(p.step);
  const steps = [
    { label: "Commandée", date: card.purchasedAt },
    { label: "Imprimée", date: p.readyAt },
    { label: p.mode === "retrait" ? "Remise" : "Expédiée", date: p.handedAt },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const done = i <= at;
        return (
          <li key={s.label} className="flex flex-col gap-1.5">
            <span className={cn("h-1 rounded-full", done ? "bg-primary" : "bg-base-300")} />
            <span className={cn("text-sm", done ? "font-semibold text-base-content" : "text-base-content/50")}>
              {s.label}
              {s.date && done && <span className="font-normal text-base-content/55"> · {frDayShort(s.date)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Handover({ card, onAdvance }: { card: Physical; onAdvance: () => void }) {
  const p = card.physical;
  const pending = p.step !== "remise";
  return (
    <div className={cn(pending && "rounded-box bg-base-200 p-5")}>
      <p className="mb-4 flex items-start gap-2 text-[15px] text-base-content">
        {p.mode === "retrait" ? (
          <>
            <Store aria-hidden className="mt-0.5 size-4 shrink-0 text-base-content/55" />
            Retrait au salon {salonLabel(p.salonId)}
          </>
        ) : (
          <>
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-base-content/55" />
            <span>
              Livraison à {p.zone} — {p.address}
              <span className="block text-sm text-base-content/55">
                Frais {p.feeFcfa === 0 ? "offerts" : `payés : ${fcfa(p.feeFcfa)}`}
              </span>
            </span>
          </>
        )}
      </p>
      <Steps card={card} />
      {pending && (
        <button type="button" onClick={onAdvance} className={cn(btnPrimary, "mt-5 gap-2")}>
          {p.step === "a-preparer" ? (
            <>
              <Printer aria-hidden className="size-4" /> Imprimer
            </>
          ) : p.mode === "retrait" ? (
            "Marquer comme remise"
          ) : (
            <>
              <Truck aria-hidden className="size-4" /> Marquer comme expédiée
            </>
          )}
        </button>
      )}
    </div>
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

  const failed = card.format === "digitale" && card.digital.status === "echec";
  const physicalPending = card.format === "physique" && card.physical.step !== "remise";
  const samePerson = card.recipient.name === card.buyer.name;

  return (
    <DetailModal
      title={`Carte cadeau ${card.format === "digitale" ? "digitale" : "physique"}`}
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <header>
          <h3 className="text-[26px] leading-tight font-semibold tracking-tight text-base-content">
            {card.kind === "montant"
              ? `Carte de ${fcfa(card.amountFcfa)}`
              : `Carte de ${prestations.length} prestation${prestations.length > 1 ? "s" : ""}`}
          </h3>
          <p className="mt-1 text-[15px] text-base-content/60">
            <span className="tabular-nums">{card.code}</span> · achetée le {frLongDate(card.purchasedAt)}{" "}
            {card.soldAt === "en-ligne" ? "en ligne" : `à ${salonLabel(card.soldAt)}`}
          </p>
        </header>

        {/* 1. Ce qui attend un geste. */}
        {failed && card.format === "digitale" && (
          <div className="rounded-box border border-error/30 bg-error/5 p-5">
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
        )}
        {physicalPending && card.format === "physique" && <Handover card={card} onAdvance={onAdvance} />}

        {/* 2. Ce qui reste. */}
        <section className={cn((failed || physicalPending) && "border-t border-base-300 pt-6")}>
          {card.kind === "montant" ? (
            used === 0 ? (
              // Rien d'utilisé : le titre dit déjà le montant, pas de second chiffre.
              <p className="text-[15px] font-medium text-base-content">Pas encore utilisée</p>
            ) : (
              <>
                <p className="text-sm text-base-content/55">Solde</p>
                <p
                  className={cn(
                    "text-[30px] leading-tight font-semibold tabular-nums",
                    balance === 0 || expired ? "text-base-content/45" : "text-base-content",
                  )}
                >
                  {fcfa(balance)}
                </p>
                <div className="mt-2 h-1 max-w-sm overflow-hidden rounded-full bg-base-300" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(balance / card.amountFcfa) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-sm tabular-nums text-base-content/60">
                  {fcfa(used)} utilisés sur {fcfa(card.amountFcfa)}
                </p>
              </>
            )
          ) : (
            <>
              <p className="text-sm text-base-content/55">
                Prestations{usedCount > 0 && ` · ${usedCount} sur ${prestations.length} utilisée${usedCount > 1 ? "s" : ""}`}
              </p>
              <ul className="mt-2 space-y-1.5">
                {prestations.map((p) => (
                  <li key={p.id} className="flex items-start gap-2 text-[16px]">
                    <Check
                      aria-hidden
                      className={cn("mt-1 size-4 shrink-0", p.used ? "text-success" : "text-base-content/20")}
                    />
                    <span className={p.used ? "text-base-content/50 line-through" : "font-semibold text-base-content"}>
                      {p.name}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className={cn(card.kind === "montant" && used === 0 ? "mt-0.5 text-sm" : "mt-3 text-sm", expired ? "font-medium text-error" : "text-base-content/55")}>
            {expired ? "Expirée le " : "Valable jusqu'au "}
            {frLongDate(expiresAt(card))}
          </p>
        </section>

        {/* 3. Qui. */}
        <section className="border-t border-base-300 pt-6">
          <dl className="grid grid-cols-2 gap-6">
            <Person label={samePerson ? "Achetée pour soi par" : "Offerte par"} person={card.buyer} />
            {!samePerson && <Person label="Pour" person={card.recipient} />}
          </dl>
          {card.message && (
            <blockquote className="mt-4 border-l border-base-300 pl-4 text-[15px] text-base-content/75 italic">
              « {card.message} »
            </blockquote>
          )}
        </section>

        {/* 4. Envoi / remise une fois faits. */}
        {card.format === "digitale" && !failed && (
          <Section title="Envoi">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[15px] text-base-content">
                  {card.digital.channel === "whatsapp" ? (
                    <MessageCircle aria-hidden className="size-4 shrink-0 text-base-content/55" />
                  ) : (
                    <Mail aria-hidden className="size-4 shrink-0 text-base-content/55" />
                  )}
                  {CHANNEL_LABELS[card.digital.channel]} · {card.digital.to}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-base-content/55">
                  {card.digital.status === "programmee" ? (
                    <>
                      <Clock aria-hidden className="size-3.5" /> Partira le {frLongDate(card.digital.scheduledFor)}
                    </>
                  ) : (
                    <>Envoyée le {frStamp(card.digital.sentAt!)}</>
                  )}
                </p>
              </div>
              <button type="button" onClick={() => onResend(card.digital.to)} className={cn(btnGhost, "shrink-0")}>
                {card.digital.status === "programmee" ? "Envoyer maintenant" : "Renvoyer"}
              </button>
            </div>
          </Section>
        )}
        {card.format === "physique" && !physicalPending && (
          <Section title={card.physical.mode === "retrait" ? "Remise" : "Livraison"}>
            <Handover card={card} onAdvance={onAdvance} />
          </Section>
        )}

        {/* 5. Utilisations. */}
        {card.uses.length > 0 && (
          <Section title="Utilisations">
            <ul className="divide-y divide-base-300">
              {card.uses.map((u, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-base-content">{u.label}</p>
                    <p className="text-sm text-base-content/55">
                      {frLongDate(u.at)} · {salonLabel(u.salonId)}
                    </p>
                  </div>
                  {/* Carte prestations : jamais de prix affiché (comme point-de-vente). */}
                  {card.kind === "montant" && (
                    <span className="shrink-0 text-[15px] tabular-nums text-base-content/80">−{fcfa(u.amountFcfa)}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </DetailModal>
  );
}
