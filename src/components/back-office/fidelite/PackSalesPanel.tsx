"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { fcfa, frLongDate } from "@/lib/mock/beautyandco";
import {
  getPackPrestations,
  getPackPrice,
  type Pack,
} from "@/lib/mock/packs";
import {
  contactName,
  newPackPurchaseId,
  packFullyUsed,
  packRemainingIds,
  redeemPrestations,
  todayIso,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import { SectionCard, SelectField, EmptyList, btnPrimary, btnGhost } from "./ui";
import ContactField, { type ContactChoice } from "./ContactField";

const EMPTY_CHOICE: ContactChoice = {
  clientId: null,
  contact: { firstName: "", lastName: "", sex: "", email: "", phone: "", whatsapp: "" },
};

function Row({
  purchase,
  pack,
  onRedeem,
}: {
  purchase: PackPurchase;
  pack: Pack | undefined;
  onRedeem: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  if (!pack) return null;

  const prestations = getPackPrestations(pack);
  const remaining = packRemainingIds(purchase, pack);
  const used = packFullyUsed(purchase, pack);
  const label = (id: string) => prestations.find((p) => p.id === id)?.label ?? id;

  return (
    <li className="rounded-xl border border-base-300 px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-base-content">
            {contactName(purchase.buyer)}
            {used && (
              <Badge size="sm" color="light">
                Entièrement utilisé
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-xs text-base-content/60">
            {pack.label} · acheté le {frLongDate(purchase.purchasedAt)} ·{" "}
            {pack.prestationIds.length - remaining.length}/{pack.prestationIds.length} consommée
            {pack.prestationIds.length > 1 ? "s" : ""}
          </p>
          {remaining.length > 0 && (
            <p className="mt-1 text-xs text-base-content/60">
              Reste : {remaining.map(label).join(", ")}
            </p>
          )}
        </div>

        {!used && (
          <button
            type="button"
            onClick={() => { setOpen((v) => !v); setChecked([]); }}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content"
          >
            Consommer une prestation
          </button>
        )}
      </div>

      {open && !used && (
        <div className="mt-3 rounded-xl bg-base-200 p-4">
          <p className="text-xs text-base-content/60">
            À la confirmation d&apos;une visite. La consommation est définitive.
          </p>
          <ul className="mt-2 space-y-1.5">
            {remaining.map((id) => (
              <li key={id}>
                <label className="flex items-center gap-2 text-sm text-base-content/80">
                  <input
                    type="checkbox"
                    checked={checked.includes(id)}
                    onChange={() =>
                      setChecked((c) =>
                        c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
                      )
                    }
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  {label(id)}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={checked.length === 0}
              onClick={() => { onRedeem(checked); setOpen(false); }}
              className={btnPrimary}
            >
              Marquer consommée{checked.length > 1 ? "s" : ""}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function PackSalesPanel({
  purchases,
  packs,
  onChange,
  notify,
}: {
  purchases: PackPurchase[];
  packs: Pack[];
  onChange: (next: PackPurchase[]) => void;
  notify: (msg: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [buyer, setBuyer] = useState<ContactChoice>(EMPTY_CHOICE);
  const [packId, setPackId] = useState(packs[0]?.id ?? "");

  const packById = (id: string) => packs.find((p) => p.id === id);
  const buyerValid =
    buyer.contact.firstName.trim().length > 0 &&
    buyer.contact.lastName.trim().length > 0 &&
    packById(packId) != null;

  const resetForm = () => {
    setAdding(false);
    setBuyer(EMPTY_CHOICE);
    setPackId(packs[0]?.id ?? "");
  };

  const submit = () => {
    const pack = packById(packId);
    if (!buyerValid || !pack) return;
    const next: PackPurchase = {
      id: newPackPurchaseId(),
      packId,
      clientId: buyer.clientId,
      buyer: buyer.contact,
      purchasedAt: todayIso(),
      redeemedPrestationIds: [],
    };
    onChange([...purchases, next]);
    notify(`${pack.label} vendu à ${contactName(buyer.contact)} — ${fcfa(getPackPrice(pack))}.`);
    resetForm();
  };

  const redeem = (id: string, ids: string[]) => {
    const pu = purchases.find((p) => p.id === id);
    onChange(purchases.map((p) => (p.id === id ? redeemPrestations(p, ids) : p)));
    if (pu) {
      notify(
        `${ids.length} prestation${ids.length > 1 ? "s" : ""} consommée${
          ids.length > 1 ? "s" : ""
        } sur le pack de ${contactName(pu.buyer)}.`,
      );
    }
  };

  return (
    <SectionCard
      title="Packs vendus"
      description="Les packs achetés et leur consommation. Un pack n'expire jamais : les prestations restantes restent disponibles pour n'importe quelle visite future."
    >
      {purchases.length === 0 ? (
        <EmptyList>Aucun pack vendu.</EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {purchases.map((pu) => (
            <Row
              key={pu.id}
              purchase={pu}
              pack={packById(pu.packId)}
              onRedeem={(ids) => redeem(pu.id, ids)}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-base-300 pt-6">
        {adding ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-base-content">Enregistrer une vente</h3>
            <ContactField value={buyer} onChange={setBuyer} label="Acheteur" />
            <SelectField
              label="Pack"
              value={packId}
              onChange={setPackId}
              options={packs.map((p) => ({
                value: p.id,
                label: `${p.label} — ${fcfa(getPackPrice(p))}`,
              }))}
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={submit} disabled={!buyerValid} className={btnPrimary}>
                Enregistrer la vente
              </button>
              <button type="button" onClick={resetForm} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={btnPrimary}>
            Enregistrer une vente
          </button>
        )}
      </div>
    </SectionCard>
  );
}
