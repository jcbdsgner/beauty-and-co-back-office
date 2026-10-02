"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { Card } from "@/components/ui/atoms/card";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import { buttonVariants } from "@/components/ui/atoms/button";
import { fcfa, frLongDate, type ClientRow } from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import { getForfaitPrestations, type Forfait } from "@/lib/mock/forfaits";
import {
  ABONNEMENT_STATUS_META,
  MAX_CYCLES,
  MIN_CYCLES,
  abonnementStatus,
  amountDueForCycles,
  availablePrestationIds,
  computeNextDueDate,
  contactName,
  estimatePrepaidDueDate,
  markAbonnementPaid,
  newAbonnementId,
  revokeAbonnement,
  todayIso,
  type Abonnement,
} from "@/lib/mock/abonnements";
import { cn } from "@/lib/utils";
import { EditorPanel } from "../reglages/kit";
import { SelectField, btnPrimary, btnGhost, btnOutline, Toggle, SettingRow } from "./ui";
import ContactField, { type ContactChoice } from "./ContactField";
import { HolderFicheLink, HolderName, holderMatches } from "./HolderRef";
import { FollowUpSection, NoMatch } from "./FollowUpSection";

const EMPTY_CHOICE: ContactChoice = {
  clientId: null,
  contact: { firstName: "", lastName: "", sex: "", email: "", phone: "", whatsapp: "" },
};

function PayControl({
  forfait,
  onConfirm,
  onCancel,
}: {
  forfait: Forfait;
  onConfirm: (cycles: number) => void;
  onCancel: () => void;
}) {
  const [cycles, setCycles] = useState(1);
  return (
    <div className="mt-4 rounded-box bg-base-200 p-4">
      <p className="text-[15px] font-semibold text-base-content">Encaisser l&apos;échéance</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="inline-flex items-center rounded-field border border-base-300 bg-white">
          <button
            type="button"
            onClick={() => setCycles((c) => Math.max(MIN_CYCLES, c - 1))}
            className="px-3 py-2 text-base-content/70 hover:text-base-content disabled:opacity-40"
            disabled={cycles <= MIN_CYCLES}
            aria-label="Un cycle de moins"
          >
            −
          </button>
          <span className="w-16 text-center text-sm font-medium tabular-nums">
            {cycles} cycle{cycles > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setCycles((c) => Math.min(MAX_CYCLES, c + 1))}
            className="px-3 py-2 text-base-content/70 hover:text-base-content disabled:opacity-40"
            disabled={cycles >= MAX_CYCLES}
            aria-label="Un cycle de plus"
          >
            +
          </button>
        </div>
        <p className="text-sm text-base-content/70">
          <span className="font-semibold tabular-nums text-base-content">
            {fcfa(amountDueForCycles(forfait, cycles))}
          </span>{" "}
          · prochaine échéance le {frLongDate(estimatePrepaidDueDate(cycles, forfait.cycleDays))}
        </p>
      </div>
      <p className="mt-2 text-sm text-base-content/60">
        Les prestations du forfait sont rechargées pour le cycle suivant.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => onConfirm(cycles)} className={btnPrimary}>
          Enregistrer le paiement
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Annuler
        </button>
      </div>
    </div>
  );
}

function Row({
  ab,
  row,
  forfait,
  onPay,
  onRevoke,
}: {
  ab: Abonnement;
  row: ClientRow | null;
  forfait: Forfait;
  onPay: (cycles: number) => void;
  onRevoke: () => void;
}) {
  const [open, setOpen] = useState<"pay" | "revoke" | null>(null);

  const status = abonnementStatus(ab, forfait.cycleDays);
  const meta = ABONNEMENT_STATUS_META[status];
  const due = status === "due";
  const remaining = availablePrestationIds(forfait.prestationIds, ab.redeemedPrestationIds);
  const total = getForfaitPrestations(forfait).length;

  return (
    <li className={cn("rounded-box border bg-base-100 px-5 py-4", due ? "border-error-200" : "border-base-300")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <HolderName row={row} contact={ab.subscriber} />
            <Badge size="sm" color={meta.tone}>
              {meta.label}
            </Badge>
          </p>
          <p className="mt-1 text-sm text-base-content/70">
            {forfait.label} · {fcfa(forfait.priceFcfa)} / {forfait.cycleLabel.toLowerCase()}
          </p>
          {ab.beneficiary && (
            <p className="mt-0.5 text-sm text-base-content/60">
              Pour {contactName(ab.beneficiary)}
            </p>
          )}
        </div>
        <HolderFicheLink row={row} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-base-300 pt-3.5">
        <div className="min-w-0 text-sm">
          <p className={cn("font-medium", due ? "text-error-600" : "text-base-content")}>
            {due ? "En retard depuis le " : "Échéance le "}
            <span className="whitespace-nowrap">{frLongDate(computeNextDueDate(ab, forfait.cycleDays))}</span>
          </p>
          <p className="mt-0.5 text-base-content/60">
            {remaining.length} prestation{remaining.length > 1 ? "s" : ""} restante
            {remaining.length > 1 ? "s" : ""} sur {total} ce cycle
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(open === "pay" ? null : "pay")}
            className={due ? btnPrimary : btnOutline}
          >
            Encaisser
          </button>
          <DropdownMenu
            trigger={
              <button
                type="button"
                aria-label={`Plus d'actions pour ${contactName(ab.subscriber)}`}
                className="btn btn-ghost btn-sm btn-square text-base-content/60"
              >
                <MoreHorizontal aria-hidden className="size-5" />
              </button>
            }
            items={[
              { label: "Révoquer l'abonnement", tone: "danger", onSelect: () => setOpen("revoke") },
            ]}
          />
        </div>
      </div>

      {open === "pay" && (
        <PayControl
          forfait={forfait}
          onConfirm={(cycles) => { onPay(cycles); setOpen(null); }}
          onCancel={() => setOpen(null)}
        />
      )}
      {open === "revoke" && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-box bg-error-50 px-4 py-3">
          <p className="text-sm text-base-content">
            Révoquer l&apos;abonnement de {contactName(ab.subscriber)} ? Il ne sera plus
            reconduit.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => { onRevoke(); setOpen(null); }}
              className={buttonVariants({ variant: "danger", size: "sm" })}
            >
              Révoquer
            </button>
            <button type="button" onClick={() => setOpen(null)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function AbonnementsPanel({
  abonnements,
  forfaits,
  query,
  onClearQuery,
  onChange,
  notify,
}: {
  abonnements: Abonnement[];
  forfaits: Forfait[];
  query: string;
  onClearQuery: () => void;
  onChange: (next: Abonnement[]) => void;
  notify: (msg: string) => void;
}) {
  const { getDetail } = useClientsData();
  const [adding, setAdding] = useState(false);
  const [subscriber, setSubscriber] = useState<ContactChoice>(EMPTY_CHOICE);
  const [forfaitId, setForfaitId] = useState(forfaits[0]?.id ?? "");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [beneficiary, setBeneficiary] = useState<ContactChoice>(EMPTY_CHOICE);

  const forfaitById = (id: string) => forfaits.find((f) => f.id === id);

  // Lignes enrichies (fiche cliente, forfait, statut) puis filtrées par la
  // recherche ; les échéances à encaisser d'abord, puis par date d'échéance.
  const items = useMemo(() => {
    const out: {
      ab: Abonnement;
      row: ClientRow | null;
      forfait: Forfait;
      status: ReturnType<typeof abonnementStatus>;
      dueOn: string;
    }[] = [];
    for (const ab of abonnements) {
      const forfait = forfaits.find((f) => f.id === ab.forfaitId);
      if (!forfait) continue;
      const row = ab.clientId ? getDetail(ab.clientId)?.row ?? null : null;
      out.push({
        ab,
        row,
        forfait,
        status: abonnementStatus(ab, forfait.cycleDays),
        dueOn: computeNextDueDate(ab, forfait.cycleDays),
      });
    }
    return out;
  }, [abonnements, forfaits, getDetail]);

  const matching = items.filter((it) =>
    holderMatches(query, {
      row: it.row,
      contacts: it.ab.beneficiary ? [it.ab.subscriber, it.ab.beneficiary] : [it.ab.subscriber],
      labels: [it.forfait.label],
    }),
  );
  const rank = { due: 0, current: 1, revoked: 2 } as const;
  const active = matching
    .filter((it) => it.status !== "revoked")
    .sort((a, b) => rank[a.status] - rank[b.status] || a.dueOn.localeCompare(b.dueOn));
  const revoked = matching.filter((it) => it.status === "revoked");

  const activeTotal = items.filter((it) => it.status !== "revoked").length;
  const dueTotal = items.filter((it) => it.status === "due").length;

  const subscriberValid =
    subscriber.contact.firstName.trim().length > 0 &&
    subscriber.contact.lastName.trim().length > 0 &&
    forfaitById(forfaitId) != null;

  const resetForm = () => {
    setAdding(false);
    setSubscriber(EMPTY_CHOICE);
    setForfaitId(forfaits[0]?.id ?? "");
    setForSomeoneElse(false);
    setBeneficiary(EMPTY_CHOICE);
  };

  const submit = () => {
    if (!subscriberValid) return;
    const iso = todayIso();
    const next: Abonnement = {
      id: newAbonnementId(),
      forfaitId,
      clientId: subscriber.clientId,
      subscriber: subscriber.contact,
      beneficiary: forSomeoneElse ? beneficiary.contact : null,
      subscribedAt: iso,
      lastPaidAt: iso,
      revokedAt: null,
      redeemedPrestationIds: [],
    };
    onChange([...abonnements, next]);
    notify(`Abonnement créé pour ${contactName(subscriber.contact)}.`);
    resetForm();
  };

  const pay = (id: string, cycles: number) => {
    const ab = abonnements.find((a) => a.id === id);
    const f = ab && forfaitById(ab.forfaitId);
    if (!ab || !f) return;
    onChange(abonnements.map((a) => (a.id === id ? markAbonnementPaid(a, f.cycleDays, cycles) : a)));
    notify(
      cycles > 1
        ? `${cycles} cycles réglés pour ${contactName(ab.subscriber)}.`
        : `Paiement enregistré pour ${contactName(ab.subscriber)}.`,
    );
  };

  const revoke = (id: string) => {
    const ab = abonnements.find((a) => a.id === id);
    onChange(abonnements.map((a) => (a.id === id ? revokeAbonnement(a) : a)));
    if (ab) notify(`Abonnement de ${contactName(ab.subscriber)} révoqué.`);
  };

  const searching = query.trim().length > 0;

  return (
    <Card>
      <header className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Abonnements</h2>
          <p className="mt-0.5 text-sm text-base-content/60">
            {activeTotal} en cours
            {dueTotal > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-error-600">{dueTotal} à régler</span>
              </>
            )}
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={cn(btnOutline, "gap-1.5")}>
          <Plus aria-hidden className="size-4" />
          Souscrire un forfait
        </button>
      </header>

      <div className="px-6 py-5">
        {active.length === 0 ? (
          searching ? (
            <NoMatch query={query} what="abonnement" onClear={onClearQuery} />
          ) : (
            <p className="py-8 text-center text-[15px] text-base-content/60">
              Aucun abonnement en cours.
            </p>
          )
        ) : (
          <ul className="space-y-3">
            {active.map((it) => (
              <Row
                key={it.ab.id}
                ab={it.ab}
                row={it.row}
                forfait={it.forfait}
                onPay={(cycles) => pay(it.ab.id, cycles)}
                onRevoke={() => revoke(it.ab.id)}
              />
            ))}
          </ul>
        )}

        {revoked.length > 0 && (
          <FollowUpSection title="Révoqués" count={revoked.length} defaultOpen={searching}>
            {revoked.map((it) => (
              <li key={it.ab.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <HolderName row={it.row} contact={it.ab.subscriber} />
                  <p className="text-sm text-base-content/60">
                    {it.forfait.label} · révoqué le{" "}
                    {it.ab.revokedAt ? frLongDate(it.ab.revokedAt) : "—"}
                  </p>
                </div>
                <HolderFicheLink row={it.row} />
              </li>
            ))}
          </FollowUpSection>
        )}
      </div>

      <EditorPanel
        open={adding}
        title="Souscrire un forfait"
        onClose={resetForm}
        onSubmit={submit}
        submitLabel="Créer l'abonnement"
        canSubmit={subscriberValid}
      >
        <ContactField value={subscriber} onChange={setSubscriber} label="Souscriptrice" />
        <SelectField
          label="Forfait"
          value={forfaitId}
          onChange={setForfaitId}
          options={forfaits.map((f) => ({
            value: f.id,
            label: `${f.label} — ${fcfa(f.priceFcfa)} / ${f.cycleLabel.toLowerCase()}`,
          }))}
        />
        <SettingRow
          title="Pour quelqu'un d'autre"
          description="La souscriptrice paie, une autre personne profite du forfait."
          control={
            <Toggle
              checked={forSomeoneElse}
              onChange={setForSomeoneElse}
              aria-label="Forfait pour une bénéficiaire distincte"
            />
          }
        />
        {forSomeoneElse && (
          <ContactField value={beneficiary} onChange={setBeneficiary} label="Bénéficiaire" />
        )}
      </EditorPanel>
    </Card>
  );
}
