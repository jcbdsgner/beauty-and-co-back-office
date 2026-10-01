"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackageCheck, PackagePlus } from "lucide-react";
import Alert from "@/components/ui/alert/Alert";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/badge/Badge";
import DetailModal from "@/components/back-office/detail/DetailModal";
import { BoxIcon } from "@/icons";
import {
  fcfa,
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
  poolOnHand,
  prestationsUsing,
  STOCK_USE_LABELS,
  usesOf,
  productLocations,
  PROJECTION_MODEL_OPTIONS,
  projectRunout,
  RESERVE,
  stockMovements,
  usedInRecipe,
  weeklyConsumption,
  type ProjectionModel,
  type StockLocation,
  type StockMovement,
  type StockUse,
  type ThresholdOverride,
} from "@/lib/mock/stock";
import { PRODUCT_BRANDS, products } from "@/lib/mock/services";
import StockLevelChart from "./StockLevelChart";
import { SelectField, TextInput, btnPrimary } from "./ui";

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
  const [action, setAction] = useState<"adjust" | "transfer" | "split">("adjust");

  const product = products.find((p) => p.id === productId);

  const locs = productLocations(productId);
  const hasReserve = locs.includes(RESERVE);
  const salonLocs = locs.filter((l): l is SalonId => l !== RESERVE);
  const uses = usesOf(productId);
  const mixed = uses.length > 1;
  const poolsHint = (salonId: SalonId) => {
    if (!mixed) return uses[0] === "vente" ? "Vente uniquement" : "Prestations uniquement";
    const v = poolOnHand(productId, salonId, "vente", extraMovements);
    const pr = poolOnHand(productId, salonId, "prestations", extraMovements);
    if (v === null || pr === null) return "En salon";
    return `Vente ${groupThousands(v)} · Prestations ${groupThousands(pr)}`;
  };

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
  const recipeUses = prestationsUsing(productId);

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
      <DetailModal title="Fiche produit" onClose={onBack}>
        <p className="text-sm text-base-content/60">Produit inconnu.</p>
      </DetailModal>
    );
  }

  const consoTotal = breakdown.sales + breakdown.recipe;
  const scopeLabel = scope === "all" ? "tous les salons" : salonName(scope);
  const brandName = PRODUCT_BRANDS.find((b) => b.id === product.brand)?.name;
  const tone = companyCoverage === null ? null : coverageTone(companyCoverage);

  // Emplacements à l'échelle commune : la barre la plus longue = le plus haut
  // niveau ou seuil, pour comparer réserve et salons d'un coup d'œil.
  const levels = [
    ...(hasReserve ? [{ key: "reserve", label: "Réserve centrale", hint: "Non affectée à un salon", onHand: reserveLevel, threshold: null as number | null, salonId: null as SalonId | null }] : []),
    ...salonRows.map((r) => ({ key: r.salonId, label: salonName(r.salonId), hint: poolsHint(r.salonId), onHand: r.onHand, threshold: r.threshold, salonId: r.salonId as SalonId | null })),
  ];
  const scaleMax = Math.max(1, ...levels.map((l) => Math.max(l.onHand ?? 0, l.threshold ?? 0))) * 1.15;

  // Réapprovisionnement : la réponse à « faut-il commander ? », en tête.
  const needsOrder = companyBelow || (projection.reorderQty > 0 && projection.reorderBy !== null);
  const verdict =
    companyTotal === null
      ? { title: "Stock jamais inventorié", text: "Faites un inventaire pour obtenir une projection." }
      : needsOrder
        ? {
            title: `Commander ${unitsLabel(projection.reorderQty || companyThreshold)}${projection.reorderBy ? ` avant le ${frShortDate(projection.reorderBy)}` : ""}`,
            text: companyBelow
              ? `Le stock entreprise (${groupThousands(companyTotal)}) est sous son seuil de ${groupThousands(companyThreshold)}.`
              : `Délai fournisseur de ${leadDaysFor(productId)} jours.`,
          }
        : projection.runoutDate === null
          ? { title: "Rien à commander", text: "Aucune sortie récente : pas de rupture prévisible." }
          : { title: "Rien à commander pour l'instant", text: `Délai fournisseur de ${leadDaysFor(productId)} jours.` };

  const shownMovements = movements.slice(0, 10);

  return (
    <DetailModal title="Fiche produit" onClose={onBack} widthClassName="max-w-6xl">
      <div className="flex flex-col gap-8">
        {/* Identité + stock entreprise ------------------------------------ */}
        <header className="flex items-start gap-6">
          <ProductPhoto
            photo={photo ?? product.image}
            onPick={(dataUrl) => onSetPhoto(productId, dataUrl)}
            onRemove={() => onSetPhoto(productId, null)}
          />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-balance text-2xl font-semibold text-base-content">{product.name}</h1>
            <p className="mt-1.5 text-sm text-base-content/60">
              {[brandName, product.gamme].filter(Boolean).join(" · ")}
              {product.priceFcfa ? ` · vendu ${fcfa(product.priceFcfa)}` : ""}
            </p>
          </div>
          <div className="shrink-0 pt-1 text-right">
            <p className="text-sm text-base-content/60">Stock entreprise</p>
            <p className="text-4xl font-semibold tabular-nums leading-tight text-base-content">
              {companyTotal === null ? "—" : groupThousands(companyTotal)}
            </p>
            {companyCoverage !== null ? (
              <Badge size="sm" color={tone === "error" ? "error" : tone === "warning" ? "warning" : "success"}>
                ≈ {companyCoverage} j de couverture
              </Badge>
            ) : (
              <span className="text-xs text-base-content/55">Pas de sortie mesurée</span>
            )}
          </div>
        </header>

        {/* Réapprovisionnement -------------------------------------------- */}
        <section
          aria-label="Réapprovisionnement"
          className={cn(
            "grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] items-center gap-6 rounded-box px-6 py-5",
            needsOrder ? "bg-warning/10" : "bg-base-200",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                needsOrder ? "bg-warning/15 text-warning-700" : "bg-base-100 text-success-600",
              )}
            >
              {needsOrder ? <PackagePlus aria-hidden className="size-[18px]" /> : <PackageCheck aria-hidden className="size-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className={cn("text-[17px] font-semibold", needsOrder ? "text-warning-800" : "text-base-content")}>
                {verdict.title}
              </p>
              <p className="mt-0.5 text-sm text-base-content/65">{verdict.text}</p>
            </div>
          </div>
          <Figure label="Rupture estimée" value={projection.runoutDate ? frShortDate(projection.runoutDate) : "—"} />
          <Figure label="Commander avant le" value={projection.reorderBy ? frShortDate(projection.reorderBy) : "—"} />
          <div>
            <label className="text-xs text-base-content/60" htmlFor="projection-model">
              Rythme retenu
            </label>
            <select
              id="projection-model"
              value={model}
              onChange={(e) => setModel(e.target.value as ProjectionModel)}
              className="select select-sm mt-1 w-full bg-base-100 text-sm"
            >
              {PROJECTION_MODEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {!projection.reliable && projection.runoutDate !== null && (
              <p className="mt-1 text-xs text-warning-700">Indicatif : moins de 4 semaines de données.</p>
            )}
          </div>
        </section>

        {/* Où est le stock ------------------------------------------------- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-base-content">Où est le stock</h2>
            <p className="text-xs text-base-content/55">Seuils modifiables pour cette session.</p>
          </div>
          <div className="rounded-box border border-base-300">
            <ul className="divide-y divide-base-300">
              {levels.map((l) => {
                const below = l.onHand !== null && l.threshold !== null && l.onHand < l.threshold;
                return (
                  <li key={l.key} className="grid grid-cols-[220px_minmax(0,1fr)_64px_150px] items-center gap-5 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-base-content">{l.label}</p>
                      <p className={cn("text-xs", below ? "text-error-600" : "text-base-content/55")}>
                        {below ? `Sous le seuil · ${l.hint}` : l.hint}
                      </p>
                    </div>
                    <LevelBar value={l.onHand} threshold={l.threshold} max={scaleMax} below={below} />
                    <p className="text-right text-lg font-semibold tabular-nums text-base-content">
                      {l.onHand === null ? (
                        <span className="text-sm font-medium text-warning-700">Jamais compté</span>
                      ) : (
                        groupThousands(l.onHand)
                      )}
                    </p>
                    {l.salonId ? (
                      <label className="flex items-center justify-end gap-2 text-xs text-base-content/60">
                        Seuil
                        <ThresholdInput
                          value={l.threshold ?? 0}
                          onCommit={(value) => onSetThreshold({ productId, salon: l.salonId!, value })}
                        />
                      </label>
                    ) : (
                      <span />
                    )}
                  </li>
                );
              })}
              <li className="grid grid-cols-[220px_minmax(0,1fr)_64px_150px] items-center gap-5 bg-base-200/60 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-base-content">Total entreprise</p>
                  <p className={cn("text-xs", companyBelow ? "text-error-600" : "text-base-content/55")}>
                    {companyBelow ? "Sous le seuil" : "Réserve + salons"}
                  </p>
                </div>
                <span />
                <p className="text-right text-lg font-semibold tabular-nums text-base-content">
                  {companyTotal === null ? "—" : groupThousands(companyTotal)}
                </p>
                <label className="flex items-center justify-end gap-2 text-xs text-base-content/60">
                  Seuil
                  <ThresholdInput value={companyThreshold} onCommit={(value) => onSetThreshold({ productId, value })} />
                </label>
              </li>
            </ul>
          </div>
        </section>

        {/* Analyse | Actions ------------------------------------------------ */}
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-8">
          <div className="flex min-w-0 flex-col gap-8">
            <StockLevelChart history={history} />

            <section>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-base-content">Consommation</h2>
                <p className="text-xs text-base-content/55">8 dernières semaines · {scopeLabel}</p>
              </div>
              {scopeWeekly === 0 && usedInRecipe(productId) && (
                <div className="mb-4">
                  <Alert
                    variant="warning"
                    title="Aucune sortie depuis 60 jours"
                    message="Ce produit figure encore dans une recette de prestation mais n'a pas bougé. Vérifiez que la recette est à jour."
                    showLink
                    linkHref="/services"
                    linkText="Ouvrir Services"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-8 rounded-box border border-base-300 p-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-base-content">Sorties</p>
                  {consoTotal === 0 ? (
                    <p className="text-sm text-base-content/60">Aucune sortie mesurée sur la période.</p>
                  ) : (
                    <div className="space-y-4">
                      <ConsoBar label="Ventes au détail" value={breakdown.sales} total={consoTotal} />
                      <ConsoBar label="Prestations" value={breakdown.recipe} total={consoTotal} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-base-content">Utilisé dans</p>
                  {recipeUses.length === 0 ? (
                    <p className="text-sm text-base-content/60">Aucune recette : vendu au détail uniquement.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recipeUses.map((u) => (
                        <li key={u.id} className="flex items-baseline justify-between gap-3 text-sm">
                          <Link
                            href="/services"
                            className="min-w-0 truncate text-base-content/80 underline-offset-2 transition hover:text-secondary hover:underline"
                          >
                            {u.name}
                          </Link>
                          <span className="shrink-0 tabular-nums text-base-content/60">
                            {groupThousands(u.qty)} {u.unit} / visite
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <section className="rounded-box border border-base-300 p-5">
              <h2 className="text-lg font-semibold text-base-content">Mouvement</h2>
              <p className="mb-4 mt-0.5 text-xs text-base-content/55">Enregistré pour cette session.</p>
              {(() => {
                const actions = [
                  { value: "adjust", label: "Ajuster" },
                  ...(hasReserve && salonLocs.length > 0 ? [{ value: "transfer", label: "Transférer" }] : []),
                  ...(mixed && salonLocs.length > 0 ? [{ value: "split", label: "Répartir" }] : []),
                ];
                return actions.length > 1 ? (
                  <SegmentedToggle
                    size="sm"
                    className="mb-5"
                    value={action}
                    onChange={(v) => setAction(v as "adjust" | "transfer" | "split")}
                    options={actions}
                    aria-label="Type de mouvement"
                  />
                ) : null;
              })()}
              {action === "split" && mixed && salonLocs.length > 0 ? (
                <SplitForm
                  productId={productId}
                  salonLocs={salonLocs}
                  extraMovements={extraMovements}
                  onAddMovements={onAddMovements}
                />
              ) : action === "transfer" && hasReserve && salonLocs.length > 0 ? (
                <TransferForm
                  productId={productId}
                  salonLocs={salonLocs}
                  reserveLevel={reserveLevel}
                  uses={uses}
                  onAddMovements={onAddMovements}
                />
              ) : (
                <AdjustForm
                  productId={productId}
                  locations={locs}
                  uses={uses}
                  extraMovements={extraMovements}
                  onAddMovements={onAddMovements}
                />
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-base-content">Derniers mouvements</h2>
              {shownMovements.length === 0 ? (
                <p className="text-sm text-base-content/60">Aucun mouvement enregistré.</p>
              ) : (
                <ol className="divide-y divide-base-300 border-y border-base-300">
                  {shownMovements.map((m) => {
                    const label = movementReasonLabel(m.reason);
                    const note = m.note && m.note !== label && !m.note.startsWith("Transfert") ? m.note : null;
                    const place =
                      m.reason === "transfer"
                        ? m.qty < 0
                          ? `${locationName(m.location)} → ${m.note?.replace("Transfert vers ", "") ?? ""}`
                          : m.note?.startsWith("Transfert depuis la réserve")
                            ? `Réserve → ${locationName(m.location)}`
                            : locationName(m.location)
                        : locationName(m.location);
                    const detail = mixed && m.location !== RESERVE ? `${place} · ${STOCK_USE_LABELS[m.use ?? (m.reason === "recipe" ? "prestations" : "vente")].toLowerCase()}` : place;
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-base-content">{label}</p>
                          <p className="truncate text-xs text-base-content/55">
                            {frShortDate(m.date)} · {detail}
                            {note ? ` · ${note}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            m.qty >= 0 ? "text-success-600" : "text-base-content/70",
                          )}
                        >
                          {m.qty >= 0 ? "+" : "−"}
                          {groupThousands(Math.abs(m.qty))}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </DetailModal>
  );
}

const unitsLabel = (n: number) => `${groupThousands(n)} unité${n > 1 ? "s" : ""}`;

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-base-content/60">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-base-content">{value}</p>
    </div>
  );
}

// Niveau d'un emplacement sur l'échelle commune, repère vertical au seuil.
function LevelBar({
  value,
  threshold,
  max,
  below,
}: {
  value: number | null;
  threshold: number | null;
  max: number;
  below: boolean;
}) {
  const pct = value === null ? 0 : Math.min(100, (value / max) * 100);
  const tick = threshold === null ? null : Math.min(100, (threshold / max) * 100);
  return (
    <div className="relative h-2.5 rounded-full bg-muted" aria-hidden>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", below ? "bg-error-500" : "bg-brand-500")}
        style={{ width: `${pct}%` }}
      />
      {tick !== null && (
        <span
          className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-base-content/45"
          style={{ left: `calc(${tick}% - 1px)` }}
          title="Seuil"
        />
      )}
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
    <div className="w-28 shrink-0">
      <div className="relative size-28 overflow-hidden rounded-box border border-base-300 bg-base-200">
        {photo ? (
          <Image src={photo} alt="" fill sizes="112px" unoptimized className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-base-content/30">
            <BoxIcon className="size-10" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-secondary underline-offset-2 transition hover:underline"
        >
          {photo ? "Changer" : "Ajouter une photo"}
        </button>
        {photo && (
          <button
            type="button"
            onClick={onRemove}
            className="text-base-content/45 transition hover:text-error-600 hover:underline"
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
      className="h-8 w-16 rounded-field border border-base-300 bg-white px-2 text-center text-sm text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire « Ajuster »                                              */
/* ------------------------------------------------------------------ */

function AdjustForm({
  productId,
  locations,
  uses,
  extraMovements,
  onAddMovements,
}: {
  productId: string;
  locations: StockLocation[];
  uses: StockUse[];
  extraMovements: StockMovement[];
  onAddMovements: (movements: StockMovement[]) => void;
}) {
  const [location, setLocation] = useState<StockLocation>(locations[0] ?? RESERVE);
  const [use, setUse] = useState<StockUse>(uses[0]);
  const inSalon = location !== RESERVE;
  const [kind, setKind] = useState<(typeof ADJUST_KINDS)[number]["value"]>("inventory");
  const [qty, setQty] = useState("");

  const kindMeta = ADJUST_KINDS.find((k) => k.value === kind)!;
  const parsed = parseInt(qty.replace(/[^\d]/g, ""), 10);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  // Dans un salon, on compte / reçoit / retire dans un des deux stocks.
  const current = inSalon
    ? poolOnHand(productId, location as SalonId, use, extraMovements)
    : locationOnHand(productId, location, extraMovements);

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
        ...(inSalon ? { use } : {}),
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
      <p className="text-xs text-base-content/60">
        Après un comptage, une réception fournisseur ou une casse.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {locations.length > 1 && (
          <SelectField
            label="Emplacement"
            value={location}
            onChange={setLocation}
            options={locations.map((l) => ({ value: l, label: locationName(l) }))}
          />
        )}
        {inSalon && uses.length > 1 && (
          <SelectField
            label="Stock"
            value={use}
            onChange={setUse}
            options={uses.map((u) => ({ value: u, label: `Stock ${STOCK_USE_LABELS[u].toLowerCase()}` }))}
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
      <div className="mt-5">
        <button type="button" className={cn(btnPrimary, "w-full")} disabled={!valid} onClick={submit}>
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
  uses,
  onAddMovements,
}: {
  productId: string;
  salonLocs: SalonId[];
  reserveLevel: number | null;
  uses: StockUse[];
  onAddMovements: (movements: StockMovement[]) => void;
}) {
  const [toSalon, setToSalon] = useState<SalonId>(salonLocs[0]);
  const [toUse, setToUse] = useState<StockUse>(uses[0]);
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
        use: toUse,
        note: "Transfert depuis la réserve",
      },
    ]);
    setQty("");
  };

  return (
    <div>
      <p className="text-xs text-base-content/60">
        Sort de la réserve centrale, entre dans le salon.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        <SelectField
          label="Salon destinataire"
          value={toSalon}
          onChange={setToSalon}
          options={salonLocs.map((id) => ({ value: id, label: salonName(id) }))}
        />
        {uses.length > 1 && (
          <SelectField
            label="Vers le stock"
            value={toUse}
            onChange={setToUse}
            options={uses.map((u) => ({ value: u, label: `Stock ${STOCK_USE_LABELS[u].toLowerCase()}` }))}
          />
        )}
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
      <div className="mt-5">
        <button type="button" className={cn(btnPrimary, "w-full")} disabled={!valid} onClick={submit}>
          Transférer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire « Répartir » — d'un stock à l'autre dans un salon        */
/* ------------------------------------------------------------------ */

function SplitForm({
  productId,
  salonLocs,
  extraMovements,
  onAddMovements,
}: {
  productId: string;
  salonLocs: SalonId[];
  extraMovements: StockMovement[];
  onAddMovements: (movements: StockMovement[]) => void;
}) {
  const [salon, setSalon] = useState<SalonId>(salonLocs[0]);
  const [from, setFrom] = useState<StockUse>("vente");
  const [qty, setQty] = useState("");
  const to: StockUse = from === "vente" ? "prestations" : "vente";
  const available = poolOnHand(productId, salon, from, extraMovements);

  const parsed = parseInt(qty.replace(/[^\d]/g, ""), 10);
  const valid = Number.isFinite(parsed) && parsed > 0 && available !== null && parsed <= available;

  const submit = () => {
    if (!valid) return;
    const date = todayIso();
    const note = `${STOCK_USE_LABELS[from]} → ${STOCK_USE_LABELS[to].toLowerCase()}`;
    onAddMovements([
      { id: newMovementId(), productId, location: salon, date, qty: -parsed, reason: "transfer", use: from, note },
      { id: newMovementId(), productId, location: salon, date, qty: parsed, reason: "transfer", use: to, note },
    ]);
    setQty("");
  };

  return (
    <div>
      <p className="text-xs text-base-content/60">
        Passe des unités du stock vente au stock prestations d&apos;un salon, ou l&apos;inverse.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {salonLocs.length > 1 && (
          <SelectField
            label="Salon"
            value={salon}
            onChange={setSalon}
            options={salonLocs.map((id) => ({ value: id, label: salonName(id) }))}
          />
        )}
        <SelectField
          label="Sens"
          value={from}
          onChange={setFrom}
          options={[
            { value: "vente", label: "Du stock vente vers les prestations" },
            { value: "prestations", label: "Du stock prestations vers la vente" },
          ]}
        />
        <TextInput
          label="Quantité"
          value={qty}
          onChange={setQty}
          inputMode="numeric"
          placeholder="0"
          hint={
            available === null
              ? "Stock jamais inventorié"
              : `Stock ${STOCK_USE_LABELS[from].toLowerCase()} : ${groupThousands(available)} disponible${available > 1 ? "s" : ""}`
          }
        />
      </div>
      <div className="mt-5">
        <button type="button" className={cn(btnPrimary, "w-full")} disabled={!valid} onClick={submit}>
          Répartir
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
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-base-content/80">{label}</span>
        <span className="text-base-content/60">
          {groupThousands(value)} · {pct} %
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
