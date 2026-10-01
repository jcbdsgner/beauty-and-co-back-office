"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { clientNumberLabel, fcfa, frLongDate } from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import {
  getForfaitPrestations,
  type Forfait,
} from "@/lib/mock/forfaits";
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
  type Contact,
} from "@/lib/mock/abonnements";
import { SectionCard, SelectField, EmptyList, btnPrimary, btnGhost, Toggle, SettingRow } from "./ui";
import ContactField, { type ContactChoice } from "./ContactField";

const EMPTY_CHOICE: ContactChoice = {
  clientId: null,
  contact: { firstName: "", lastName: "", sex: "", email: "", phone: "", whatsapp: "" },
};

/** Nom du souscripteur + n° client ; lien vers sa fiche s'il est dans le fichier. */
function SubscriberRef({ clientId, contact }: { clientId: string | null; contact: Contact }) {
  const { getDetail } = useClientsData();
  const row = clientId ? getDetail(clientId)?.row : null;
  if (!row) {
    return (
      <>
        {contactName(contact)}
        <span className="text-xs font-normal text-base-content/45">Hors fichier</span>
      </>
    );
  }
  return (
    <Link
      href={`/clients/${row.id}`}
      className="inline-flex items-baseline gap-2 hover:underline underline-offset-2"
    >
      {contactName(contact)}
      <span className="text-xs font-medium tabular-nums text-base-content/60">
        {clientNumberLabel(row.number)}
      </span>
    </Link>
  );
}

function PayControl({
  forfait,
  cycleDays,
  onConfirm,
  onCancel,
}: {
  forfait: Forfait;
  cycleDays: number;
  onConfirm: (cycles: number) => void;
  onCancel: () => void;
}) {
  const [cycles, setCycles] = useState(1);
  return (
    <div className="mt-3 rounded-xl bg-base-200 p-4">
      <p className="text-sm font-medium text-base-content">
        Encaisser {cycles} cycle{cycles > 1 ? "s" : ""}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div className="inline-flex items-center rounded-lg border border-base-300 bg-white">
          <button
            type="button"
            onClick={() => setCycles((c) => Math.max(MIN_CYCLES, c - 1))}
            className="px-3 py-1.5 text-base-content/70 hover:text-base-content disabled:opacity-40"
            disabled={cycles <= MIN_CYCLES}
            aria-label="Un cycle de moins"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums">{cycles}</span>
          <button
            type="button"
            onClick={() => setCycles((c) => Math.min(MAX_CYCLES, c + 1))}
            className="px-3 py-1.5 text-base-content/70 hover:text-base-content disabled:opacity-40"
            disabled={cycles >= MAX_CYCLES}
            aria-label="Un cycle de plus"
          >
            +
          </button>
        </div>
        <span className="text-sm text-base-content/70">
          {fcfa(amountDueForCycles(forfait, cycles))} · prochaine échéance le{" "}
          {frLongDate(estimatePrepaidDueDate(cycles, cycleDays))}
        </span>
      </div>
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
  forfait,
  onPay,
  onRevoke,
}: {
  ab: Abonnement;
  forfait: Forfait | undefined;
  onPay: (cycles: number) => void;
  onRevoke: () => void;
}) {
  const [open, setOpen] = useState<"pay" | "revoke" | null>(null);
  if (!forfait) return null;

  const status = abonnementStatus(ab, forfait.cycleDays);
  const meta = ABONNEMENT_STATUS_META[status];
  const remaining = availablePrestationIds(forfait.prestationIds, ab.redeemedPrestationIds);
  const total = getForfaitPrestations(forfait);

  return (
    <li className="rounded-xl border border-base-300 px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-base-content">
            <SubscriberRef clientId={ab.clientId} contact={ab.subscriber} />
            <Badge size="sm" color={meta.tone}>
              {meta.label}
            </Badge>
          </p>
          <p className="mt-0.5 text-xs text-base-content/60">
            {forfait.label} · {fcfa(forfait.priceFcfa)} / {forfait.cycleLabel.toLowerCase()}
          </p>
          {ab.beneficiary && (
            <p className="mt-0.5 text-xs text-base-content/60">
              Bénéficiaire : {contactName(ab.beneficiary)}
            </p>
          )}
          {status !== "revoked" && (
            <p className="mt-1 text-xs text-base-content/60">
              Prochaine échéance le {frLongDate(computeNextDueDate(ab, forfait.cycleDays))} ·{" "}
              {remaining.length}/{total.length} prestation{total.length > 1 ? "s" : ""} disponible
              {remaining.length > 1 ? "s" : ""} ce cycle
            </p>
          )}
        </div>

        {status !== "revoked" && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setOpen(open === "pay" ? null : "pay")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content"
            >
              Marquer payé
            </button>
            {open === "revoke" ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-base-content/60">Révoquer&nbsp;?</span>
                <button
                  type="button"
                  onClick={() => { onRevoke(); setOpen(null); }}
                  className="font-semibold text-error-600 hover:underline"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="font-medium text-base-content/60 hover:underline"
                >
                  Non
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOpen("revoke")}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-base-content/70 hover:bg-error-50 hover:text-error-600"
              >
                Révoquer
              </button>
            )}
          </div>
        )}
      </div>

      {open === "pay" && (
        <PayControl
          forfait={forfait}
          cycleDays={forfait.cycleDays}
          onConfirm={(cycles) => { onPay(cycles); setOpen(null); }}
          onCancel={() => setOpen(null)}
        />
      )}
    </li>
  );
}

export default function AbonnementsPanel({
  abonnements,
  forfaits,
  onChange,
  notify,
}: {
  abonnements: Abonnement[];
  forfaits: Forfait[];
  onChange: (next: Abonnement[]) => void;
  notify: (msg: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [subscriber, setSubscriber] = useState<ContactChoice>(EMPTY_CHOICE);
  const [forfaitId, setForfaitId] = useState(forfaits[0]?.id ?? "");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [beneficiary, setBeneficiary] = useState<ContactChoice>(EMPTY_CHOICE);

  const forfaitById = (id: string) => forfaits.find((f) => f.id === id);
  const active = abonnements.filter((a) => a.revokedAt == null);
  const revoked = abonnements.filter((a) => a.revokedAt != null);

  const forfaitOptions = forfaits.map((f) => ({ value: f.id, label: f.label }));

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

  return (
    <SectionCard
      title="Abonnements en cours"
      description="Le suivi des engagements : qui est à jour, qui a une échéance à encaisser, qui a révoqué. Encaisser une échéance recharge toutes les prestations du forfait pour le cycle suivant."
    >
      {active.length === 0 ? (
        <EmptyList>Aucun abonnement actif.</EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {active.map((ab) => (
            <Row
              key={ab.id}
              ab={ab}
              forfait={forfaitById(ab.forfaitId)}
              onPay={(cycles) => pay(ab.id, cycles)}
              onRevoke={() => revoke(ab.id)}
            />
          ))}
        </ul>
      )}

      {revoked.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-base-content/45">
            Abonnements révoqués
          </p>
          <ul className="space-y-2">
            {revoked.map((ab) => {
              const f = forfaitById(ab.forfaitId);
              return (
                <li
                  key={ab.id}
                  className="rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content/60"
                >
                  <SubscriberRef clientId={ab.clientId} contact={ab.subscriber} /> · {f?.label ?? ab.forfaitId} · révoqué le{" "}
                  {ab.revokedAt ? frLongDate(ab.revokedAt) : "—"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-base-300 pt-6">
        {adding ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-base-content">Souscrire un forfait</h3>
            <ContactField value={subscriber} onChange={setSubscriber} label="Souscripteur" />
            <SelectField
              label="Forfait"
              value={forfaitId}
              onChange={setForfaitId}
              options={forfaitOptions}
            />
            <SettingRow
              title="Pour quelqu'un d'autre"
              description="La souscriptrice paie, une autre personne profite du forfait (rappels envoyés au bénéficiaire)."
              control={
                <Toggle
                  checked={forSomeoneElse}
                  onChange={setForSomeoneElse}
                  aria-label="Forfait pour un bénéficiaire distinct"
                />
              }
            />
            {forSomeoneElse && (
              <ContactField value={beneficiary} onChange={setBeneficiary} label="Bénéficiaire" />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={submit} disabled={!subscriberValid} className={btnPrimary}>
                Créer l&apos;abonnement
              </button>
              <button type="button" onClick={resetForm} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={btnPrimary}>
            Souscrire un forfait
          </button>
        )}
      </div>
    </SectionCard>
  );
}
