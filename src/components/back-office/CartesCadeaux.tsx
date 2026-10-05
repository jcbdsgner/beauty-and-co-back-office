"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Gift, Settings, Smartphone, Store, Truck } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Toast } from "@/components/ui/molecules/toast";
import { fcfa, salons, today as demoNow } from "@/lib/mock/beautyandco";
import { addDays, TODAY_ISO } from "@/lib/mock/planning";
import {
  balanceOf,
  bucketOf,
  CHANNEL_LABELS,
  frDayShort,
  frStamp,
  giftCardMatches,
  giftCardPrestations,
  giftCardSeeds,
  isExpired,
  needsAction,
  nowStamp,
  outstanding,
  type GiftCard,
  type GiftCardBucket,
  type GiftCardFormat,
} from "@/lib/mock/cartes-cadeaux";
import { cn } from "@/lib/utils";
import FideliteTabs from "./fidelite/FideliteTabs";
import GiftCardDetail from "./fidelite/GiftCardDetail";
import { FollowUpSection, NoMatch } from "./fidelite/FollowUpSection";
import { btnOutline, btnPrimary } from "./fidelite/ui";

// Écran « Cartes cadeaux » (onglet de Fidélité, 2026-10-05) — les cartes
// vendues, vues par format : digitales d'un côté, physiques de l'autre.
// 1. Ce qu'elle vient faire : savoir ce qui attend un geste (une carte
//    physique à imprimer ou à remettre, un envoi digital qui a échoué),
//    retrouver une carte (par nom, n° de carte, prestation ou téléphone) et
//    voir ce qu'il reste dessus — un solde (carte montant) ou des prestations
//    (carte prestations). L'acheteur est le nom en tête de ligne, le
//    destinataire vient dessous. Vocabulaire de la file de point-de-vente
//    (À imprimer, Prêtes à remettre, Marquer comme remise / expédiée).
// 2. Ce qui doit sauter aux yeux : le choix du format, qui porte pour chacun
//    le nombre de cartes à traiter et le solde encore dû ; puis, dans la
//    liste, les cartes qui attendent quelque chose, en tête, avec leur bouton.
// 3. Quand ça se passe mal : envoi en échec (motif + correction de l'adresse
//    dans la fiche), carte expirée avec un solde (grisée, « Expirée »),
//    recherche sans résultat (« Effacer la recherche » ; si l'autre format
//    trouve quelque chose, on le dit et on y mène), aucune carte (état vide).
// Aucun backend : les gestes (renvoyer, imprimer, marquer remise) vivent en
// mémoire de session.

const TODAY = TODAY_ISO;
const NOW = nowStamp(TODAY, demoNow.currentTime);
const SINCE_30D = addDays(TODAY, -30);

const salonLabel = (id: string) => salons.find((s) => s.id === id)?.name ?? id;

type SectionDef = { bucket: GiftCardBucket; title: string; hint?: string };

const SECTIONS: Record<GiftCardFormat, SectionDef[]> = {
  digitale: [
    { bucket: "echec", title: "Envoi en échec", hint: "Le destinataire n'a rien reçu" },
    { bucket: "programmee", title: "Envoi programmé" },
    { bucket: "en-circulation", title: "En circulation" },
  ],
  physique: [
    { bucket: "a-preparer", title: "À imprimer" },
    { bucket: "prete", title: "Prêtes à remettre" },
    { bucket: "en-circulation", title: "En circulation" },
  ],
};

const ROW_GRID = "grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.15fr)_10rem] items-center gap-6";

/* ------------------------------------------------------------- choix du format */

function FormatTab({
  format,
  active,
  cards,
  onSelect,
}: {
  format: GiftCardFormat;
  active: boolean;
  cards: GiftCard[];
  onSelect: () => void;
}) {
  const digital = format === "digitale";
  const Icon = digital ? Smartphone : Gift;
  const live = cards.filter((c) => bucketOf(c, TODAY) !== "terminee");
  const toHandle = cards.filter((c) => needsAction(bucketOf(c, TODAY))).length;
  const sold30 = cards.filter((c) => c.purchasedAt > SINCE_30D);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-5 rounded-box border bg-base-100 p-5 text-left transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]",
        active
          ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-base-300 hover:border-base-content/25",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              active ? "bg-primary text-primary-content" : "bg-accent text-secondary",
            )}
          >
            <Icon aria-hidden className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-base-content">
              Cartes {digital ? "digitales" : "physiques"}
            </span>
            <span className="block text-sm text-base-content/60">
              {digital ? "Envoyées par e-mail ou WhatsApp" : "Retirées au salon ou livrées"}
            </span>
          </span>
        </span>
        {toHandle > 0 ? (
          <span className="rounded-full bg-error/10 px-2.5 py-1 text-sm font-semibold whitespace-nowrap text-error">
            {toHandle} à traiter
          </span>
        ) : (
          <span className="text-sm whitespace-nowrap text-base-content/50">Rien à traiter</span>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-4 border-t border-base-300 pt-4">
        <div>
          <dt className="text-sm text-base-content/55">Solde à honorer</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-base-content">
            {fcfa(outstanding(cards, TODAY))}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-base-content/55">En cours</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-base-content">
            {live.length} carte{live.length > 1 ? "s" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-base-content/55">Vendues · 30 jours</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-base-content">
            {sold30.length} · {fcfa(sold30.reduce((n, c) => n + c.amountFcfa, 0))}
          </dd>
        </div>
      </dl>
    </button>
  );
}

/* ------------------------------------------------------------------- lignes */

function Delivery({ card }: { card: GiftCard }) {
  if (card.format === "digitale") {
    const d = card.digital;
    return (
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium text-base-content">
          {CHANNEL_LABELS[d.channel]} · <span className="font-normal text-base-content/70">{d.to}</span>
        </p>
        <p
          className={cn(
            "mt-0.5",
            d.status === "echec" ? "font-medium text-error" : "text-base-content/60",
          )}
        >
          {d.status === "echec"
            ? d.failure
            : d.status === "programmee"
              ? `Partira le ${frDayShort(d.scheduledFor)}`
              : `Envoyée le ${frStamp(d.sentAt!)}`}
        </p>
      </div>
    );
  }
  const p = card.physical;
  const Icon = p.mode === "retrait" ? Store : Truck;
  const where = p.mode === "retrait" ? `Retrait · ${salonLabel(p.salonId)}` : `Livraison · ${p.zone}`;
  const state =
    p.step === "a-preparer"
      ? `Commandée le ${frDayShort(card.purchasedAt)}`
      : p.step === "prete"
        ? `Imprimée le ${frDayShort(p.readyAt!)}`
        : `${p.mode === "retrait" ? "Remise" : "Expédiée"} le ${frDayShort(p.handedAt!)}`;
  return (
    <div className="min-w-0 text-sm">
      <p className="flex items-center gap-1.5 truncate font-medium text-base-content">
        <Icon aria-hidden className="size-3.5 shrink-0 text-base-content/55" />
        {where}
      </p>
      <p className="mt-0.5 text-base-content/60">{state}</p>
    </div>
  );
}

// Sous le nom de l'acheteur : à qui va la carte (point-de-vente : « l'acheteur
// s'il l'a achetée pour lui-même »).
const recipientLine = (card: GiftCard) =>
  card.recipient.name === card.buyer.name ? "Pour soi" : `Pour ${card.recipient.name}`;

/** Ce que la carte offre et ce qu'il en reste : un solde, ou des prestations. */
function Content({ card }: { card: GiftCard }) {
  const expired = isExpired(card, TODAY);
  if (card.kind === "prestations") {
    const list = giftCardPrestations(card);
    const left = list.filter((p) => !p.used).length;
    const done = left === 0 || expired;
    return (
      <div className="min-w-0">
        <p
          className={cn("line-clamp-2 text-[15px] leading-snug font-semibold", done ? "text-base-content/45" : "text-base-content")}
          title={list.map((p) => p.name).join(" · ")}
        >
          {list.map((p) => p.name).join(" · ")}
        </p>
        <p className="text-sm text-base-content/55">
          {expired && left > 0
            ? "Expirée"
            : left === list.length
              ? `${list.length} prestation${list.length > 1 ? "s" : ""} · aucune utilisée`
              : `${list.length - left} sur ${list.length} utilisée${list.length - left > 1 ? "s" : ""}`}
        </p>
      </div>
    );
  }
  const balance = balanceOf(card);
  const done = balance === 0 || expired;
  return (
    <div className="min-w-0">
      <p className={cn("text-[16px] font-semibold tabular-nums", done ? "text-base-content/45" : "text-base-content")}>
        {fcfa(balance)}
      </p>
      <p className="text-sm text-base-content/55">
        {expired && balance > 0
          ? "Expirée"
          : balance === 0
            ? `Épuisée · ${fcfa(card.amountFcfa)}`
            : balance === card.amountFcfa
              ? "Intacte"
              : `sur ${fcfa(card.amountFcfa)}`}
      </p>
    </div>
  );
}

function rowAction(card: GiftCard): string | null {
  if (card.format === "digitale") return card.digital.status === "echec" ? "Corriger et renvoyer" : null;
  if (card.physical.step === "a-preparer") return "Imprimer";
  if (card.physical.step === "prete")
    return card.physical.mode === "retrait" ? "Marquer comme remise" : "Marquer comme expédiée";
  return null;
}

function Row({
  card,
  onOpen,
  onAction,
}: {
  card: GiftCard;
  onOpen: () => void;
  onAction: () => void;
}) {
  const action = rowAction(card);
  const urgent = card.format === "digitale" && card.digital.status === "echec";

  return (
    // Toute la ligne ouvre la fiche à la souris ; au clavier, c'est le nom.
    <li
      onClick={onOpen}
      className={cn(
        ROW_GRID,
        "cursor-pointer rounded-box border border-base-300 bg-base-100 px-4 py-3.5 transition hover:border-base-content/25 hover:bg-base-200/40",
      )}
    >
      <div className="min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="block max-w-full truncate rounded-sm text-left text-[16px] font-semibold text-base-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]"
        >
          {card.buyer.name}
        </button>
        <p className="truncate text-sm text-base-content/60">
          {recipientLine(card)} · <span className="font-mono text-[13px] tracking-wide">{card.code}</span>
        </p>
      </div>

      <Content card={card} />

      <Delivery card={card} />

      <div className="flex justify-end">
        {action ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className={cn(urgent || card.format === "physique" && card.physical.step === "a-preparer" ? btnPrimary : btnOutline, "whitespace-nowrap")}
          >
            {action}
          </button>
        ) : (
          <ChevronRight aria-hidden className="size-5 text-base-content/35" />
        )}
      </div>
    </li>
  );
}

function ColumnHeads({ format }: { format: GiftCardFormat }) {
  return (
    <div className={cn(ROW_GRID, "mb-2 border-b border-base-300 px-4 pb-2 text-[13px] font-medium text-base-content/50")}>
      <span>Acheteur · destinataire · n° de carte</span>
      <span>Montant ou prestations</span>
      <span>{format === "digitale" ? "Envoi" : "Remise"}</span>
      <span />
    </div>
  );
}

function finishedLabel(c: GiftCard) {
  if (c.kind === "prestations") {
    const left = giftCardPrestations(c).filter((p) => !p.used).length;
    return left === 0 ? "toutes les prestations utilisées" : `expirée avec ${left} prestation${left > 1 ? "s" : ""} non utilisée${left > 1 ? "s" : ""}`;
  }
  return balanceOf(c) === 0 ? `épuisée · ${fcfa(c.amountFcfa)}` : `expirée avec ${fcfa(balanceOf(c))} non utilisés`;
}

/* -------------------------------------------------------------------- écran */

export default function CartesCadeaux() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const format: GiftCardFormat = params.get("format") === "physique" ? "physique" : "digitale";

  const [cards, setCards] = useState<GiftCard[]>(giftCardSeeds);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  const selectFormat = (f: GiftCardFormat) => {
    router.replace(f === "digitale" ? pathname : `${pathname}?format=${f}`, { scroll: false });
  };

  const byFormat = useMemo(
    () => ({
      digitale: cards.filter((c) => c.format === "digitale"),
      physique: cards.filter((c) => c.format === "physique"),
    }),
    [cards],
  );

  const matching = byFormat[format]
    .filter((c) => giftCardMatches(c, query))
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const other: GiftCardFormat = format === "digitale" ? "physique" : "digitale";
  const otherMatches = query.trim() ? byFormat[other].filter((c) => giftCardMatches(c, query)).length : 0;
  const finished = matching.filter((c) => bucketOf(c, TODAY) === "terminee");
  const searching = query.trim().length > 0;

  const update = (id: string, fn: (c: GiftCard) => GiftCard) =>
    setCards((list) => list.map((c) => (c.id === id ? fn(c) : c)));

  const resend = (card: GiftCard, to: string) => {
    if (card.format !== "digitale") return;
    update(card.id, (c) =>
      c.format === "digitale"
        ? { ...c, digital: { ...c.digital, to, status: "envoyee", sentAt: NOW, failure: undefined } }
        : c,
    );
    setNotice(`Carte ${card.code} envoyée à ${card.recipient.name} par ${CHANNEL_LABELS[card.digital.channel]}.`);
    setOpenId(null);
  };

  const advance = (card: GiftCard) => {
    if (card.format !== "physique") return;
    const p = card.physical;
    if (p.step === "remise") return;
    const next = p.step === "a-preparer" ? "prete" : "remise";
    update(card.id, (c) =>
      c.format === "physique"
        ? {
            ...c,
            physical: {
              ...c.physical,
              step: next,
              ...(next === "prete" ? { readyAt: TODAY } : { handedAt: TODAY }),
            },
          }
        : c,
    );
    setNotice(
      next === "prete"
        ? `Carte cadeau ${card.code} envoyée à l'impression.`
        : `Carte cadeau ${card.code} ${p.mode === "retrait" ? "remise" : "expédiée"}.`,
    );
  };

  const open = cards.find((c) => c.id === openId) ?? null;

  return (
    <div>
      <PageHeader
        title="Fidélité & abonnements"
        actions={
          <Link href="/reglages?section=livraison" className={`${btnOutline} gap-2`}>
            <Settings aria-hidden className="size-4" />
            Régler la livraison
          </Link>
        }
      />
      <FideliteTabs active="cartes-cadeaux" />

      <div role="tablist" aria-label="Format des cartes cadeaux" className="mb-6 grid grid-cols-2 gap-4">
        {(["digitale", "physique"] as const).map((f) => (
          <FormatTab
            key={f}
            format={f}
            active={format === f}
            cards={byFormat[f]}
            onSelect={() => selectFormat(f)}
          />
        ))}
      </div>

      <SearchInput
        placeholder="Nom, n° de carte, prestation ou téléphone"
        aria-label="Rechercher une carte cadeau"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6"
      />

      <div role="tabpanel">
        {byFormat[format].length === 0 ? (
          <p className="rounded-box border border-dashed border-base-300 py-12 text-center text-[15px] text-base-content/60">
            Aucune carte {format} vendue pour l&apos;instant.
          </p>
        ) : matching.length === 0 ? (
          <div className="rounded-box border border-base-300 bg-base-100">
            <NoMatch query={query} what={`carte ${format}`} onClear={() => setQuery("")} />
            {otherMatches > 0 && (
              <p className="-mt-4 pb-8 text-center text-sm text-base-content/60">
                {otherMatches} carte{otherMatches > 1 ? "s" : ""} {other}
                {otherMatches > 1 ? "s" : ""} correspond{otherMatches > 1 ? "ent" : ""}.{" "}
                <button
                  type="button"
                  onClick={() => selectFormat(other)}
                  className="font-semibold text-secondary underline-offset-4 hover:underline"
                >
                  Voir les cartes {other}s
                </button>
              </p>
            )}
          </div>
        ) : (
          <>
            <ColumnHeads format={format} />
            <div className="space-y-7">
              {SECTIONS[format].map((s) => {
                const list = matching.filter((c) => bucketOf(c, TODAY) === s.bucket);
                if (list.length === 0) return null;
                const action = needsAction(s.bucket);
                return (
                  <section key={s.bucket}>
                    <h2 className="mb-2.5 flex items-baseline gap-2 px-1">
                      <span
                        className={cn(
                          "text-[15px] font-semibold",
                          s.bucket === "echec" ? "text-error" : "text-base-content",
                        )}
                      >
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          action ? "font-semibold text-base-content/70" : "text-base-content/50",
                        )}
                      >
                        {list.length}
                      </span>
                      {s.hint && <span className="text-sm text-base-content/50">· {s.hint}</span>}
                    </h2>
                    <ul className="space-y-2">
                      {list.map((c) => (
                        <Row
                          key={c.id}
                          card={c}
                          onOpen={() => setOpenId(c.id)}
                          onAction={() => (c.format === "digitale" ? setOpenId(c.id) : advance(c))}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            {finished.length > 0 && (
              <FollowUpSection title="Épuisées ou expirées" count={finished.length} defaultOpen={searching}>
                {finished.map((c) => (
                  <li key={c.id} className="py-1.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(c.id)}
                      className="flex w-full items-center gap-4 rounded-field px-2 py-1.5 text-left hover:bg-base-200"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-base-content">
                          {c.buyer.name}
                        </span>
                        <span className="block truncate text-sm text-base-content/55">
                          {recipientLine(c)} · <span className="font-mono text-[13px]">{c.code}</span> ·{" "}
                          {finishedLabel(c)}
                        </span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 text-base-content/35" />
                    </button>
                  </li>
                ))}
              </FollowUpSection>
            )}
          </>
        )}
      </div>

      {open && (
        <GiftCardDetail
          key={open.id}
          card={open}
          today={TODAY}
          onClose={() => setOpenId(null)}
          onResend={(to) => resend(open, to)}
          onAdvance={() => advance(open)}
        />
      )}

      <Toast message={notice} onDismiss={dismiss} />
    </div>
  );
}
