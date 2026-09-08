"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { BoxIcon } from "@/icons";
import {
  groupThousands,
  salonName,
  type SalonId,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import {
  ADJUST_KINDS,
  consumptionBreakdown,
  coverageDays,
  coverageTone,
  effectiveCompanyMin,
  effectiveSalonMin,
  frShortDate,
  leadDaysFor,
  levelHistory,
  locationName,
  locationOnHand,
  companyOnHand,
  movementReasonLabel,
  newMovementId,
  prestationsUsing,
  productLocations,
  PROJECTION_MODEL_OPTIONS,
  projectRunout,
  projectionModelLabel,
  RESERVE,
  stockMovements,
  usedInRecipe,
  weeklyConsumption,
  type ProjectionModel,
  type StockLocation,
  type StockMovement,
  type ThresholdOverride,
} from "@/lib/mock/stock";
import { products } from "@/lib/mock/services";
import StockLevelChart from "./StockLevelChart";
import { BackButton, SectionCard, SelectField, TextInput, btnPrimary } from "./ui";

type Props = {
  productId: string;
  scope: SalonScope;
  extraMovements: StockMovement[];
  thresholds: ThresholdOverride;
  photo?: string;
  onAddMovements: (movements: StockMovement[]) => void;
  onSetThreshold: (patch: { productId: string; salon?: SalonId; value: number }) => void;
  onSetPhoto: (productId: string, dataUrl: string | null) => void;
  onBack: () => void;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function StockDetail({
  productId,
  scope,
  extraMovements,
  thresholds,
  photo,
  onAddMovements,
  onSetThreshold,
  onSetPhoto,
  onBack,
}: Props) {
  const [model, setModel] = useState<ProjectionModel>("4w");

  const product = products.find((p) => p.id === productId);

  const locs = productLocations(productId);
  const hasReserve = locs.includes(RESERVE);
  const salonLocs = locs.filter((l): l is SalonId => l !== RESERVE);

  const reserveLevel = hasReserve ? locationOnHand(productId, RESERVE, extraMovements) : null;
  const companyTotal = companyOnHand(productId, extraMovements);
  const companyThreshold = effectiveCompanyMin(productId, thresholds);
  const companyBelow = companyTotal !== null && companyTotal < companyThreshold;

  const salonRows = salonLocs.map((salonId) => {
    const onHand = locationOnHand(productId, salonId, extraMovements);
    const threshold = effectiveSalonMin(productId, salonId, thresholds);
    return { salonId, onHand, threshold, below: onHand !== null && onHand < threshold };
  });

  const companyWeekly = weeklyConsumption(productId, "all");
  const companyCoverage =
    companyTotal === null ? null : coverageDays(companyTotal, companyWeekly);

  // Consommation : honore le filtre salon global (comme avant).
  const scopeWeekly = weeklyConsumption(productId, scope);
  const breakdown = consumptionBreakdown(productId, scope);
  const uses = prestationsUsing(productId);

  const projection = projectRunout(productId, model, extraMovements);

  const history = useMemo(
    () => levelHistory(productId, extraMovements),
    [productId, extraMovements],
  );

  const movements = useMemo(
    () =>
      [...stockMovements, ...extraMovements]
        .filter((m) => m.productId === productId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [productId, extraMovements],
  );

  if (!product) {
    return (
      <div className="space-y-6">
        <BackButton onClick={onBack} />
        <p className="text-theme-sm text-gray-500">Produit inconnu.</p>
      </div>
    );
  }

  const consoTotal = breakdown.sales + breakdown.recipe;
  const scopeLabel = scope === "all" ? "tous les salons" : salonName(scope);

  return (
    <div className="space-y-6">
      {/* En-tête ---------------------------------------------------------- */}
      <div>
        <BackButton onClick={onBack} />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <ProductPhoto
              photo={photo ?? product?.image}
              onPick={(dataUrl) => onSetPhoto(productId, dataUrl)}
              onRemove={() => onSetPhoto(productId, null)}
            />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
              <p className="mt-1 text-theme-sm text-gray-500">
                Compté en {product.defaultUnit} · délai fournisseur {leadDaysFor(productId)} j
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Stock entreprise
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {companyTotal === null ? "—" : groupThousands(companyTotal)}
            </p>
            {companyCoverage !== null ? (
              <Badge
                size="sm"
                color={
                  coverageTone(companyCoverage) === "error"
                    ? "error"
                    : coverageTone(companyCoverage) === "warning"
                      ? "warning"
                      : "success"
                }
              >
                ≈ {companyCoverage} j de couverture
              </Badge>
            ) : (
              <span className="text-theme-xs text-gray-400">Pas de sortie mesurée</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* Alerte entreprise ------------------------------------------- */}
        {companyBelow && (
          <Alert
            variant="warning"
            title="Stock entreprise sous le seuil"
            message={`Total réserve + salons : ${groupThousands(
              companyTotal ?? 0,
            )} pour un seuil de ${groupThousands(
              companyThreshold,
            )}. Une commande fournisseur est conseillée (voir la projection ci-dessous).`}
          />
        )}

        {/* Niveaux & seuils ------------------------------------------- */}
        <SectionCard
          title="Niveaux & seuils"
          description="Réserve centrale et salons. Les seuils sont modifiables pour cette session uniquement."
        >
          <ul className="divide-y divide-gray-100">
            {hasReserve && (
              <li className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">Réserve centrale</p>
                  <p className="text-theme-xs text-gray-500">Non affectée à un salon</p>
                </div>
                <span className="shrink-0 text-sm text-gray-800">
                  {reserveLevel === null ? (
                    <span className="text-warning-600">Jamais inventoriée</span>
                  ) : (
                    <>
                      {groupThousands(reserveLevel)}{" "}
                      <span className="text-gray-400">{product.defaultUnit}</span>
                    </>
                  )}
                </span>
              </li>
            )}

            {salonRows.map((s) => (
              <li key={s.salonId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{salonName(s.salonId)}</p>
                  <p className="text-theme-xs text-gray-500">
                    {s.onHand === null
                      ? "Jamais inventorié"
                      : `${groupThousands(s.onHand)} en rayon`}
                    {s.below && <span className="text-error-600"> · sous le seuil</span>}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-theme-xs text-gray-500">
                  Seuil salon
                  <ThresholdInput
                    value={s.threshold}
                    onCommit={(value) =>
                      onSetThreshold({ productId, salon: s.salonId, value })
                    }
                  />
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">Total entreprise</p>
              {companyBelow ? (
                <p className="text-theme-xs text-error-600">
                  Sous le seuil — commande fournisseur conseillée
                </p>
              ) : (
                <p className="text-theme-xs text-gray-500">Réserve + salons</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-lg font-semibold text-gray-800">
                {companyTotal === null ? "—" : groupThousands(companyTotal)}
              </span>
              <label className="flex items-center gap-2 text-theme-xs text-gray-500">
                Seuil entreprise
                <ThresholdInput
                  value={companyThreshold}
                  onCommit={(value) => onSetThreshold({ productId, value })}
                />
              </label>
            </div>
          </div>
        </SectionCard>

        {/* Ajuster / transférer -------------------------------------- */}
        <SectionCard
          title="Ajuster ou transférer"
          description="Enregistré pour cette session uniquement."
        >
          <AdjustForm
            productId={productId}
            locations={locs}
            extraMovements={extraMovements}
            onAddMovements={onAddMovements}
          />

          {hasReserve && salonLocs.length > 0 && (
            <>
              <div className="-mx-6 my-6 border-t border-gray-100" />
              <TransferForm
                productId={productId}
                salonLocs={salonLocs}
                reserveLevel={reserveLevel}
                onAddMovements={onAddMovements}
              />
            </>
          )}
        </SectionCard>

        {/* Évolution du stock --------------------------------------- */}
        <StockLevelChart history={history} />

        {/* Répartition de la consommation -------------------------- */}
        {scopeWeekly === 0 && usedInRecipe(productId) && (
          <Alert
            variant="warning"
            title="Aucune sortie depuis 60 jours"
            message="Ce produit figure encore dans une recette de prestation mais n'a pas bougé. Vérifiez que la recette est à jour."
            showLink
            linkHref="/services"
            linkText="Ouvrir Services"
          />
        )}

        <SectionCard
          title="Répartition de la consommation"
          description={`Sur les 8 dernières semaines · ${scopeLabel}.`}
        >
          {consoTotal === 0 ? (
            <p className="text-theme-sm text-gray-500">
              Aucune sortie mesurée sur la période.
            </p>
          ) : (
            <div className="space-y-4">
              <ConsoBar label="Ventes au détail" value={breakdown.sales} total={consoTotal} />
              <ConsoBar
                label="Absorbé par les prestations"
                value={breakdown.recipe}
                total={consoTotal}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Utilisé dans ces prestations"
          description="Quantité prélevée à chaque visite, d'après la recette de consommation."
        >
          {uses.length === 0 ? (
            <p className="text-theme-sm text-gray-500">
              Ce produit n&apos;entre dans aucune recette : il n&apos;est que vendu
              au détail.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {uses.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-theme-sm"
                >
                  <Link
                    href="/services"
                    className="text-gray-700 transition hover:text-brand-600 hover:underline"
                  >
                    {u.name}
                  </Link>
                  <span className="shrink-0 text-gray-500">
                    {groupThousands(u.qty)} {u.unit} / visite
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Projection de rupture ----------------------------------- */}
        <SectionCard
          title="Projection de rupture — Beauty & Co"
          description="Estime la date de rupture du stock entreprise au rythme choisi, et quand commander au fournisseur."
        >
          <div className="max-w-xs">
            <SelectField
              label="Base de calcul"
              value={model}
              onChange={setModel}
              options={PROJECTION_MODEL_OPTIONS}
            />
          </div>

          {!projection.reliable && projection.runoutDate !== null && (
            <div className="mt-4">
              <Alert
                variant="warning"
                title="Projection indicative"
                message="Moins de 4 semaines de données pour ce produit : la date de rupture peut varier fortement."
              />
            </div>
          )}

          <dl className="mt-5 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-theme-xs text-gray-400">Rupture estimée</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-800">
                {projection.runoutDate ? frShortDate(projection.runoutDate) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-400">Quantité à commander</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-800">
                {projection.reorderQty > 0
                  ? `${groupThousands(projection.reorderQty)} ${product.defaultUnit}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-400">Commander avant le</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-800">
                {projection.reorderBy ? frShortDate(projection.reorderBy) : "—"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-theme-xs text-gray-400">
            Base : {projectionModelLabel(model)}.
          </p>

          {projection.runoutDate === null && (
            <p className="mt-2 text-theme-sm text-gray-500">
              Aucune sortie récente : pas de rupture prévisible.
            </p>
          )}
        </SectionCard>

        {/* Journal ------------------------------------------------- */}
        <SectionCard
          title="Journal des mouvements"
          description="Les 12 derniers mouvements, tous emplacements confondus."
        >
          {movements.length === 0 ? (
            <p className="text-theme-sm text-gray-500">Aucun mouvement enregistré.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {movements.slice(0, 12).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-theme-sm"
                >
                  <div className="min-w-0">
                    <span className="text-gray-700">{movementReasonLabel(m.reason)}</span>
                    <span className="text-gray-400"> · {locationName(m.location)}</span>
                    {m.note && <span className="text-gray-400"> · {m.note}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-gray-400">{frShortDate(m.date)}</span>
                    <span
                      className={`font-medium ${
                        m.qty >= 0 ? "text-success-600" : "text-error-600"
                      }`}
                    >
                      {m.qty >= 0 ? "+" : "−"}
                      {groupThousands(Math.abs(m.qty))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photo produit — import fonctionnel, gardé en mémoire de session     */
/* ------------------------------------------------------------------ */

function ProductPhoto({
  photo,
  onPick,
  onRemove,
}: {
  photo?: string;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="shrink-0">
      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {photo ? (
          <Image src={photo} alt="" fill sizes="80px" unoptimized className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gray-300">
            <BoxIcon className="size-8" />
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-theme-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-brand-600 transition hover:underline"
        >
          {photo ? "Changer" : "Ajouter une photo"}
        </button>
        {photo && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 transition hover:text-error-600 hover:underline"
          >
            Retirer
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seuil éditable — remonté au blur / Entrée, pas d'effet             */
/* ------------------------------------------------------------------ */

function ThresholdInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (value: number) => void;
}) {
  const commit = (raw: string) => {
    const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n);
  };
  return (
    <input
      key={value}
      defaultValue={value}
      inputMode="numeric"
      aria-label="Seuil"
      onBlur={(e) => {
        commit(e.currentTarget.value);
        e.currentTarget.value = String(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-8 w-16 rounded-lg border border-gray-300 bg-white px-2 text-center text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire « Ajuster »                                              */
/* ------------------------------------------------------------------ */

function AdjustForm({
  productId,
  locations,
  extraMovements,
  onAddMovements,
}: {
  productId: string;
  locations: StockLocation[];
  extraMovements: StockMovement[];
  onAddMovements: (movements: StockMovement[]) => void;
}) {
  const [location, setLocation] = useState<StockLocation>(locations[0] ?? RESERVE);
  const [kind, setKind] = useState<(typeof ADJUST_KINDS)[number]["value"]>("inventory");
  const [qty, setQty] = useState("");

  const kindMeta = ADJUST_KINDS.find((k) => k.value === kind)!;
  const parsed = parseInt(qty.replace(/[^\d]/g, ""), 10);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  const current = locationOnHand(productId, location, extraMovements);

  const submit = () => {
    if (!valid) return;
    let delta: number;
    if (kind === "inventory") delta = parsed - (current ?? 0);
    else if (kind === "restock") delta = parsed;
    else delta = -parsed;
    onAddMovements([
      {
        id: newMovementId(),
        productId,
        location,
        date: todayIso(),
        qty: delta,
        reason: kind,
        note:
          kind === "inventory"
            ? `Inventaire compté : ${parsed}`
            : kind === "restock"
              ? "Réception saisie"
              : "Casse ou perte",
      },
    ]);
    setQty("");
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-800">Ajuster un niveau</p>
      <p className="mt-0.5 text-theme-xs text-gray-500">
        Après un comptage, une réception fournisseur ou une casse.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {locations.length > 1 && (
          <SelectField
            label="Emplacement"
            value={location}
            onChange={setLocation}
            options={locations.map((l) => ({ value: l, label: locationName(l) }))}
          />
        )}
        <SelectField
          label="Motif"
          value={kind}
          onChange={setKind}
          options={ADJUST_KINDS.map((k) => ({ value: k.value, label: k.label }))}
        />
        <TextInput
          label={kind === "inventory" ? "Quantité comptée" : "Quantité"}
          value={qty}
          onChange={setQty}
          inputMode="numeric"
          placeholder="0"
          hint={kindMeta.help}
        />
      </div>
      <div className="mt-4">
        <button type="button" className={btnPrimary} disabled={!valid} onClick={submit}>
          Enregistrer le mouvement
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire « Transférer » — réserve → salon                        */
/* ------------------------------------------------------------------ */

function TransferForm({
  productId,
  salonLocs,
  reserveLevel,
  onAddMovements,
}: {
  productId: string;
  salonLocs: SalonId[];
  reserveLevel: number | null;
  onAddMovements: (movements: StockMovement[]) => void;
}) {
  const [toSalon, setToSalon] = useState<SalonId>(salonLocs[0]);
  const [qty, setQty] = useState("");

  const parsed = parseInt(qty.replace(/[^\d]/g, ""), 10);
  const valid =
    Number.isFinite(parsed) &&
    parsed > 0 &&
    reserveLevel !== null &&
    parsed <= reserveLevel;

  const submit = () => {
    if (!valid) return;
    const date = todayIso();
    onAddMovements([
      {
        id: newMovementId(),
        productId,
        location: RESERVE,
        date,
        qty: -parsed,
        reason: "transfer",
        note: `Transfert vers ${salonName(toSalon)}`,
      },
      {
        id: newMovementId(),
        productId,
        location: toSalon,
        date,
        qty: parsed,
        reason: "transfer",
        note: "Transfert depuis la réserve",
      },
    ]);
    setQty("");
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-800">Transférer vers un salon</p>
      <p className="mt-0.5 text-theme-xs text-gray-500">
        Sort de la réserve centrale, entre dans le salon.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <SelectField
          label="Salon destinataire"
          value={toSalon}
          onChange={setToSalon}
          options={salonLocs.map((id) => ({ value: id, label: salonName(id) }))}
        />
        <TextInput
          label="Quantité"
          value={qty}
          onChange={setQty}
          inputMode="numeric"
          placeholder="0"
          hint={
            reserveLevel === null
              ? "Réserve jamais inventoriée"
              : `Réserve : ${groupThousands(reserveLevel)} disponible${
                  reserveLevel > 1 ? "s" : ""
                }`
          }
        />
      </div>
      <div className="mt-4">
        <button type="button" className={btnPrimary} disabled={!valid} onClick={submit}>
          Transférer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ConsoBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-theme-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {groupThousands(value)} · {pct} %
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
