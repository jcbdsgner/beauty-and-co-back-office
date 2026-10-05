"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight, Clock, Mail, MessageCircle, Settings, Store, Truck } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Toast } from "@/components/ui/molecules/toast";
import { fcfa, salons, today as demoNow } from "@/lib/mock/beautyandco";
import { TODAY_ISO } from "@/lib/mock/planning";
import {
  balanceOf,
  bucketOf,
  CHANNEL_LABELS,
  frDayShort,
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

// Écran « Cartes cadeaux » (onglet de Fidélité). Refonte du 2026-10-05 après
// critique (skill `impeccable`) : la fiche latérale porte le détail, la liste
// ne garde que ce qui sert à décider d'ouvrir une carte ou d'agir dessus.
// 1. Ce qu'elle vient faire : traiter ce qui attend un geste (une carte
//    physique à imprimer ou à remettre, un envoi digital en échec) et
//    retrouver une carte (nom, n° de carte, prestation, téléphone).
// 2. Ce qui saute aux yeux : la bascule Digitales / Physiques, qui porte le
//    nombre à traiter de chaque format ; puis les sections « à traiter » en
//    tête, avec leur bouton. Une ligne = acheteur (et pour qui), ce qu'il
//    reste sur la carte, où elle en est, l'action.
// 3. Quand ça se passe mal : envoi en échec en rouge avec son motif (la
//    correction se fait dans la fiche), carte expirée grisée, recherche sans
//    résultat (« Effacer » ; si l'autre format trouve, on y mène), aucune carte.
// Retiré par rapport à la 1ʳᵉ version : les 6 chiffres des cartes de format
// (seul le solde dû reste, en une ligne), les en-têtes de colonnes, l'adresse
// d'envoi et « Intacte » dans les lignes (dans la fiche).

const TODAY = TODAY_ISO;
const NOW = nowStamp(TODAY, demoNow.currentTime);

const salonLabel = (id: string) => salons.find((s) => s.id === id)?.name ?? id;

type SectionDef = { bucket: GiftCardBucket; title: string };

const SECTIONS: Record<GiftCardFormat, SectionDef[]> = {
  digitale: [
    { bucket: "echec", title: "Envoi en échec" },
    { bucket: "programmee", title: "Envoi programmé" },
    { bucket: "en-circulation", title: "En circulation" },
  ],
  physique: [
    { bucket: "a-preparer", title: "À imprimer" },
    { bucket: "prete", title: "Prêtes à remettre" },
    { bucket: "en-circulation", title: "En circulation" },
  ],
};

const ROW_GRID = "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_13rem] items-center gap-6";

/* ------------------------------------------------------------- bascule de format */

function FormatSwitch({
  format,
  counts,
  onSelect,
}: {
  format: GiftCardFormat;
  counts: Record<GiftCardFormat, { total: number; toHandle: number }>;
  onSelect: (f: GiftCardFormat) => void;
}) {
  return (
    <div role="tablist" aria-label="Format des cartes cadeaux" className="flex shrink-0 rounded-field bg-muted p-1">
      {(["digitale", "physique"] as const).map((f) => {
        const active = f === format;
        const { total, toHandle } = counts[f];
        return (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(f)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-[6px] px-4 text-[15px] font-semibold transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]",
              active
                ? "bg-base-100 text-base-content shadow-[0_1px_2px_rgba(58,45,45,0.12)]"
                : "text-base-content/60 hover:text-base-content",
            )}
          >
            {f === "digitale" ? "Digitales" : "Physiques"}
            <span className="font-medium tabular-nums text-base-content/45">{total}</span>
            {toHandle > 0 && (
              <span
                className="min-w-5 rounded-full bg-error px-1.5 text-center text-xs leading-5 font-semibold text-white tabular-nums"
                aria-label={`${toHandle} envoi${toHandle > 1 ? "s" : ""} en échec`}
              >
                {toHandle}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- lignes */

/** Ce qu'il reste sur la carte : un solde, ou des prestations. */
function Remaining({ card }: { card: GiftCard }) {
  const expired = isExpired(card, TODAY);
  if (card.kind === "prestations") {
    const list = giftCardPrestations(card);
    const left = list.filter((p) => !p.used);
    const done = left.length === 0 || expired;
    return (
      <div className="min-w-0">
        <p className={cn("text-[15px] font-semibold", done ? "text-base-content/45" : "text-base-content")}>
          {left.length} prestation{left.length > 1 ? "s" : ""}
          {left.length < list.length && (
            <span className="font-normal text-base-content/55"> sur {list.length}</span>
          )}
        </p>
        <p className="truncate text-sm text-base-content/55" title={list.map((p) => p.name).join(" · ")}>
          {(left.length > 0 ? left : list).map((p) => p.name).join(" · ")}
        </p>
      </div>
    );
  }
  const balance = balanceOf(card);
  const done = balance === 0 || expired;
  return (
    <div className="min-w-0">
      <p className={cn("text-[15px] font-semibold tabular-nums", done ? "text-base-content/45" : "text-base-content")}>
        {fcfa(balance)}
      </p>
      {balance < card.amountFcfa && (
        <p className="text-sm tabular-nums text-base-content/55">sur {fcfa(card.amountFcfa)}</p>
      )}
    </div>
  );
}

/** Où en est la carte : envoi (digitale) ou remise (physique). */
function Progress({ card }: { card: GiftCard }) {
  if (card.format === "digitale") {
    const d = card.digital;
    const Channel = d.channel === "whatsapp" ? MessageCircle : Mail;
    if (d.status === "echec")
      return (
        <p className="flex min-w-0 items-start gap-1.5 text-sm font-medium text-error">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span className="line-clamp-2">{d.failure}</span>
        </p>
      );
    return (
      <p className="flex min-w-0 items-center gap-1.5 text-sm text-base-content/70">
        {d.status === "programmee" ? (
          <Clock aria-hidden className="size-4 shrink-0 text-base-content/45" />
        ) : (
          <Channel aria-hidden className="size-4 shrink-0 text-base-content/45" />
        )}
        <span className="truncate">
          {d.status === "programmee"
            ? `Partira le ${frDayShort(d.scheduledFor)}`
            : `${CHANNEL_LABELS[d.channel]} · ${frDayShort(d.sentAt!)}`}
        </span>
      </p>
    );
  }
  const p = card.physical;
  const Icon = p.mode === "retrait" ? Store : Truck;
  const where = p.mode === "retrait" ? `Retrait à ${salonLabel(p.salonId)}` : `Livraison à ${p.zone}`;
  return (
    <div className="min-w-0 text-sm">
      <p className="flex items-center gap-1.5 truncate text-base-content/70">
        <Icon aria-hidden className="size-4 shrink-0 text-base-content/45" />
        {where}
      </p>
      {p.step !== "a-preparer" && (
        <p className="mt-0.5 pl-5.5 text-base-content/50">
          {p.step === "prete"
            ? `Imprimée le ${frDayShort(p.readyAt!)}`
            : `${p.mode === "retrait" ? "Remise" : "Expédiée"} le ${frDayShort(p.handedAt!)}`}
        </p>
      )}
    </div>
  );
}

function rowAction(card: GiftCard): { label: string; primary: boolean } | null {
  if (card.format === "digitale")
    return card.digital.status === "echec" ? { label: "Corriger et renvoyer", primary: true } : null;
  if (card.physical.step === "a-preparer") return { label: "Imprimer", primary: true };
  if (card.physical.step === "prete")
    return { label: card.physical.mode === "retrait" ? "Marquer comme remise" : "Marquer comme expédiée", primary: false };
  return null;
}

const recipientLine = (card: GiftCard) =>
  card.recipient.name === card.buyer.name ? "Pour soi" : `Pour ${card.recipient.name}`;

function Row({ card, onOpen, onAction }: { card: GiftCard; onOpen: () => void; onAction: () => void }) {
  const action = rowAction(card);
  return (
    // Toute la ligne ouvre la fiche à la souris ; au clavier, c'est le nom.
    <li
      onClick={onOpen}
      className={cn(
        ROW_GRID,
        "group cursor-pointer rounded-box border border-base-300 bg-base-100 px-5 py-3.5 transition-colors hover:border-base-content/25",
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
          {recipientLine(card)}
          <span className="text-base-content/40"> · {card.code}</span>
        </p>
      </div>

      <Remaining card={card} />
      <Progress card={card} />

      <div className="flex justify-end">
        {action ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className={cn(action.primary ? btnPrimary : btnOutline, "whitespace-nowrap")}
          >
            {action.label}
          </button>
        ) : (
          <ChevronRight
            aria-hidden
            className="size-5 text-base-content/25 transition-colors group-hover:text-base-content/55"
          />
        )}
      </div>
    </li>
  );
}

function finishedLabel(c: GiftCard) {
  if (c.kind === "prestations") {
    const left = giftCardPrestations(c).filter((p) => !p.used).length;
    return left === 0
      ? "toutes les prestations utilisées"
      : `expirée, ${left} prestation${left > 1 ? "s" : ""} non utilisée${left > 1 ? "s" : ""}`;
  }
  return balanceOf(c) === 0 ? `épuisée · ${fcfa(c.amountFcfa)}` : `expirée, ${fcfa(balanceOf(c))} non utilisés`;
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

  const selectFormat = (f: GiftCardFormat) =>
    router.replace(f === "digitale" ? pathname : `${pathname}?format=${f}`, { scroll: false });

  const byFormat = useMemo(
    () => ({
      digitale: cards.filter((c) => c.format === "digitale"),
      physique: cards.filter((c) => c.format === "physique"),
    }),
    [cards],
  );
  const counts = {
    digitale: {
      total: byFormat.digitale.length,
      toHandle: byFormat.digitale.filter((c) => bucketOf(c, TODAY) === "echec").length,
    },
    physique: {
      total: byFormat.physique.length,
      // Une carte physique pas encore remise suit son cours normal : pas d'alerte.
      toHandle: 0,
    },
  };

  const matching = byFormat[format]
    .filter((c) => giftCardMatches(c, query))
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const other: GiftCardFormat = format === "digitale" ? "physique" : "digitale";
  const otherMatches = query.trim() ? byFormat[other].filter((c) => giftCardMatches(c, query)).length : 0;
  const finished = matching.filter((c) => bucketOf(c, TODAY) === "terminee");
  const searching = query.trim().length > 0;
  const live = byFormat[format].filter((c) => bucketOf(c, TODAY) !== "terminee").length;

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
            physical: { ...c.physical, step: next, ...(next === "prete" ? { readyAt: TODAY } : { handedAt: TODAY }) },
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

      <div className="mb-3 flex items-center gap-4">
        <FormatSwitch format={format} counts={counts} onSelect={selectFormat} />
        <SearchInput
          placeholder="Nom, n° de carte, prestation ou téléphone"
          aria-label="Rechercher une carte cadeau"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md flex-1"
        />
      </div>
      <p className="mb-7 text-sm text-base-content/55">
        {live} carte{live > 1 ? "s" : ""} en cours · encore dû{" "}
        <span className="font-semibold tabular-nums text-base-content/80">
          {fcfa(outstanding(byFormat[format], TODAY))}
        </span>
      </p>

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
            <div className="space-y-8">
              {SECTIONS[format].map((s) => {
                const list = matching.filter((c) => bucketOf(c, TODAY) === s.bucket);
                if (list.length === 0) return null;
                const action = needsAction(s.bucket);
                return (
                  <section key={s.bucket}>
                    <h2 className="mb-3 flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-[17px] font-semibold",
                          s.bucket === "echec" ? "text-error" : action ? "text-base-content" : "text-base-content/70",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="text-[15px] tabular-nums text-base-content/45">{list.length}</span>
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
                  <li key={c.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => setOpenId(c.id)}
                      className="flex w-full items-center gap-4 rounded-field px-2 py-2 text-left hover:bg-base-200"
                    >
                      <span className="min-w-0 flex-1 truncate text-[15px] text-base-content/70">
                        <span className="font-medium text-base-content">{c.buyer.name}</span>
                        <span className="text-base-content/55"> · {finishedLabel(c)}</span>
                      </span>
                      <span className="shrink-0 text-sm text-base-content/40">{c.code}</span>
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
