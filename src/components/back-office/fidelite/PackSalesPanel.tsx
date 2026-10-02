"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/atoms/card";
import { fcfa, frLongDate, type ClientRow } from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import { getPackPrestations, getPackPrice, type Pack } from "@/lib/mock/packs";
import {
  contactName,
  newPackPurchaseId,
  packFullyUsed,
  packRemainingIds,
  redeemPrestations,
  todayIso,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import { cn } from "@/lib/utils";
import { EditorPanel } from "../reglages/kit";
import { SelectField, btnPrimary, btnGhost, btnOutline } from "./ui";
import ContactField, { type ContactChoice } from "./ContactField";
import { HolderFicheLink, HolderName, holderMatches } from "./HolderRef";
import { FollowUpSection, NoMatch } from "./FollowUpSection";

const EMPTY_CHOICE: ContactChoice = {
  clientId: null,
  contact: { firstName: "", lastName: "", sex: "", email: "", phone: "", whatsapp: "" },
};

/** Une case par prestation du pack : pleine = déjà utilisée. */
function UsageBar({ used, total }: { used: number; total: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-8 rounded-full", i < used ? "bg-primary" : "bg-base-300")}
        />
      ))}
    </div>
  );
}

function Row({
  purchase,
  row,
  pack,
  onRedeem,
}: {
  purchase: PackPurchase;
  row: ClientRow | null;
  pack: Pack;
  onRedeem: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

  const prestations = getPackPrestations(pack);
  const remaining = packRemainingIds(purchase, pack);
  const total = pack.prestationIds.length;
  const used = total - remaining.length;
  const label = (id: string) => prestations.find((p) => p.id === id)?.label ?? id;

  return (
    <li className="rounded-box border border-base-300 bg-base-100 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <HolderName row={row} contact={purchase.buyer} />
          <p className="mt-1 text-sm text-base-content/70">
            {pack.label} · acheté le {frLongDate(purchase.purchasedAt)}
          </p>
        </div>
        <HolderFicheLink row={row} />
      </div>

      <div className="mt-4 border-t border-base-300 pt-3.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UsageBar used={used} total={total} />
            <span className="font-medium tabular-nums text-base-content">
              {used} sur {total} utilisée{used > 1 ? "s" : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setOpen((v) => !v); setChecked([]); }}
            className={cn(btnOutline, "shrink-0")}
          >
            Utiliser
          </button>
        </div>
        <p className="mt-1.5 text-base-content/60">Reste : {remaining.map(label).join(", ")}</p>
      </div>

      {open && (
        <div className="mt-4 rounded-box bg-base-200 p-4">
          <p className="text-[15px] font-semibold text-base-content">
            Quelle prestation a été faite ?
          </p>
          <ul className="mt-2 space-y-2">
            {remaining.map((id) => (
              <li key={id}>
                <label className="flex items-center gap-2.5 text-sm text-base-content/80">
                  <input
                    type="checkbox"
                    checked={checked.includes(id)}
                    onChange={() =>
                      setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                    }
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  {label(id)}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-base-content/60">Une prestation utilisée ne se récupère pas.</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={checked.length === 0}
              onClick={() => { onRedeem(checked); setOpen(false); }}
              className={btnPrimary}
            >
              Marquer utilisée{checked.length > 1 ? "s" : ""}
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
  query,
  onClearQuery,
  onChange,
  notify,
}: {
  purchases: PackPurchase[];
  packs: Pack[];
  query: string;
  onClearQuery: () => void;
  onChange: (next: PackPurchase[]) => void;
  notify: (msg: string) => void;
}) {
  const { getDetail } = useClientsData();
  const [adding, setAdding] = useState(false);
  const [buyer, setBuyer] = useState<ContactChoice>(EMPTY_CHOICE);
  const [packId, setPackId] = useState(packs[0]?.id ?? "");

  const packById = (id: string) => packs.find((p) => p.id === id);

  const items = useMemo(() => {
    const out: { purchase: PackPurchase; row: ClientRow | null; pack: Pack; done: boolean }[] = [];
    for (const purchase of purchases) {
      const pack = packs.find((p) => p.id === purchase.packId);
      if (!pack) continue;
      const row = purchase.clientId ? getDetail(purchase.clientId)?.row ?? null : null;
      out.push({ purchase, row, pack, done: packFullyUsed(purchase, pack) });
    }
    return out;
  }, [purchases, packs, getDetail]);

  const matching = items.filter((it) =>
    holderMatches(query, { row: it.row, contacts: [it.purchase.buyer], labels: [it.pack.label] }),
  );
  // Les plus récents d'abord.
  const inProgress = matching
    .filter((it) => !it.done)
    .sort((a, b) => b.purchase.purchasedAt.localeCompare(a.purchase.purchasedAt));
  const done = matching.filter((it) => it.done);

  const inProgressTotal = items.filter((it) => !it.done).length;
  const remainingTotal = items
    .filter((it) => !it.done)
    .reduce((n, it) => n + packRemainingIds(it.purchase, it.pack).length, 0);

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
        `${ids.length} prestation${ids.length > 1 ? "s" : ""} utilisée${
          ids.length > 1 ? "s" : ""
        } sur le pack de ${contactName(pu.buyer)}.`,
      );
    }
  };

  const searching = query.trim().length > 0;

  return (
    <Card>
      <header className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Packs</h2>
          <p className="mt-0.5 text-sm text-base-content/60">
            {inProgressTotal} en cours · {remainingTotal} prestation{remainingTotal > 1 ? "s" : ""} à
            honorer
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={cn(btnOutline, "gap-1.5")}>
          <Plus aria-hidden className="size-4" />
          Vendre un pack
        </button>
      </header>

      <div className="px-6 py-5">
        {inProgress.length === 0 ? (
          searching ? (
            <NoMatch query={query} what="pack" onClear={onClearQuery} />
          ) : (
            <p className="py-8 text-center text-[15px] text-base-content/60">Aucun pack en cours.</p>
          )
        ) : (
          <ul className="space-y-3">
            {inProgress.map((it) => (
              <Row
                key={it.purchase.id}
                purchase={it.purchase}
                row={it.row}
                pack={it.pack}
                onRedeem={(ids) => redeem(it.purchase.id, ids)}
              />
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <FollowUpSection title="Entièrement utilisés" count={done.length} defaultOpen={searching}>
            {done.map((it) => (
              <li key={it.purchase.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <HolderName row={it.row} contact={it.purchase.buyer} />
                  <p className="text-sm text-base-content/60">
                    {it.pack.label} · acheté le {frLongDate(it.purchase.purchasedAt)}
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
        title="Vendre un pack"
        onClose={resetForm}
        onSubmit={submit}
        submitLabel="Enregistrer la vente"
        canSubmit={buyerValid}
      >
        <ContactField value={buyer} onChange={setBuyer} label="Acheteuse" />
        <SelectField
          label="Pack"
          value={packId}
          onChange={setPackId}
          options={packs.map((p) => ({ value: p.id, label: `${p.label} — ${fcfa(getPackPrice(p))}` }))}
        />
      </EditorPanel>
    </Card>
  );
}
