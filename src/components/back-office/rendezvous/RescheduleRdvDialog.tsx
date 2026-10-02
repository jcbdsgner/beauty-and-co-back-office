"use client";

import { useMemo, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CalendarDays, Check, ChevronDown, MapPin, X } from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { DatePicker } from "@/components/ui/molecules/date-picker";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { Button } from "@/components/ui/atoms/button";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { cn } from "@/lib/utils";
import { useServicesData } from "@/components/back-office/services/ServicesData";
import { isClosed, salonConfig, salonConfigs, type SalonId, type Weekday } from "@/lib/mock/beautyandco";
import { TODAY_ISO, type PlanningData } from "@/lib/mock/planning";
import {
  conflictWith,
  durationLabel,
  prestationsForSalon,
  type Prestation,
} from "@/lib/mock/services";
import {
  beneficiaryKey,
  fcfa,
  frFullDate,
  posteTypeForCategory,
  type RdvDetail,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";
import { alternativesFor, availableTimes, planAt, type PlanContext, type PlanItem } from "@/lib/prise-rdv/planifier";

// « Reprogrammer le rendez-vous » — ce que fait « Modifier » sur une fiche
// rendez-vous : nouvelle date, nouveau salon, nouvel horaire et, replié en
// dessous, les prestations à ajouter ou retirer. Les praticiennes suivent
// (affectation automatique) : l'actuelle est gardée si elle reste libre.
// 1. Elle arrive avec un imprévu en tête (« la cliente décale à samedi »),
//    souvent au téléphone : trois choix, dans l'ordre où on les dicte.
// 2. Ce qui compte : les horaires réellement libres ce jour-là, dans ce salon,
//    pour toutes les prestations — on ne propose jamais un horaire impossible.
// 3. Quand ça coince : salon fermé, aucun horaire libre, prestation non
//    proposée dans l'autre salon, incompatibilité → dit en clair, sans bloquer
//    les autres choix.

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const isoToDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dateToIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// « jeu. 3 sept. » — résumé du pied, sur une ligne.
const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(isoToDate(iso));

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Une ligne en cours d'édition : une ligne existante (gardée telle quelle,
// praticienne comprise si elle reste libre) ou une prestation du catalogue
// ajoutée pour une personne.
type Line = { key: string; personKey: string; prestationId: string; existing?: RdvPrestation };

type Person = { key: string; label: string; source: RdvPrestation };

let seq = 1;
const newLineId = () => `p-resched-${Date.now().toString(36)}-${seq++}`;

function openingLabel(salonId: SalonId, iso: string): string | null {
  if (isClosed(salonId, iso)) return null;
  const day = salonConfig(salonId).hours[WEEKDAY_BY_JS_DAY[isoToDate(iso).getDay()]];
  return day.closed ? null : `Ouvert de ${day.open} à ${day.close}`;
}

export type Reschedule = { date: string; salon: SalonId; prestations: RdvPrestation[] };

export default function RescheduleRdvDialog({
  open,
  detail,
  rdvs,
  planningData,
  onClose,
  onConfirm,
}: {
  open: boolean;
  detail: RdvDetail;
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  onClose: () => void;
  onConfirm: (next: Reschedule) => void;
}) {
  const { services, prestations: catalog } = useServicesData();
  const currentDay = detail.date.slice(0, 10);
  const currentTime = detail.date.slice(11, 16);

  // Personnes servies, dans l'ordre du rendez-vous (la payeuse d'abord).
  const people = useMemo<Person[]>(() => {
    const map = new Map<string, Person>();
    for (const p of [...detail.prestations].sort((a, b) => a.start.localeCompare(b.start))) {
      const key = beneficiaryKey(p, detail.client.name);
      if (!map.has(key)) map.set(key, { key, label: p.beneficiaryName || detail.client.name, source: p });
    }
    return [...map.values()].sort((a, b) => Number(b.key === "__payer__") - Number(a.key === "__payer__"));
  }, [detail]);

  const initialLines = useMemo<Line[]>(
    () =>
      [...detail.prestations]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((p) => ({
          key: p.id,
          personKey: beneficiaryKey(p, detail.client.name),
          prestationId: p.prestationId,
          existing: p,
        })),
    [detail],
  );

  const [day, setDay] = useState(currentDay);
  const [salon, setSalon] = useState<SalonId>(detail.salon);
  const [time, setTime] = useState<string | null>(currentTime);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [editingOpen, setEditingOpen] = useState(false);
  const [person, setPerson] = useState(people[0]?.key ?? "__payer__");
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const categoryName = (serviceId: string | null) =>
    services.find((s) => s.id === serviceId)?.name ?? "Autres prestations";

  // Durée d'une ligne : celle du rendez-vous pour une ligne gardée (« à deux »
  // déjà divisée), celle du catalogue pour une ligne ajoutée.
  const lineDuration = (l: Line) => l.existing?.durationMin ?? byId.get(l.prestationId)?.durationMin ?? 0;
  const linePrice = (l: Line) => l.existing?.price ?? byId.get(l.prestationId)?.priceFcfa ?? 0;
  const lineName = (l: Line) => l.existing?.name ?? byId.get(l.prestationId)?.name ?? "Prestation";

  const ctx: PlanContext = useMemo(
    () => ({
      date: day,
      salonId: salon,
      rdvs,
      planningData,
      excludeRdvId: detail.id,
      availabilityOf: (id) => byId.get(id),
    }),
    [day, salon, rdvs, planningData, detail.id, byId],
  );

  const items: PlanItem[] = lines.map((l) => ({
    key: l.key,
    personId: l.personKey,
    serviceId: l.prestationId,
    categoryId: byId.get(l.prestationId)?.serviceId ?? "",
    durationMinutes: lineDuration(l),
    twoPractitionersEligible: false,
  }));
  // L'intervenante actuelle est gardée tant qu'elle reste libre.
  const overrides = Object.fromEntries(
    lines.filter((l) => l.existing?.staff).map((l) => [l.key, [l.existing!.staff!]]),
  );

  // Prestations que le salon choisi ne propose pas : bloquant, dit en clair.
  const offered = new Set(prestationsForSalon(catalog, salon).map((p) => p.id));
  const notOffered = lines.filter((l) => !offered.has(l.prestationId));

  const opening = openingLabel(salon, day);
  const times = useMemo(
    () => (opening && notOffered.length === 0 ? availableTimes(ctx, items, false) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, opening, notOffered.length, JSON.stringify(items)],
  );
  const chosenTime = time && times.includes(time) ? time : null;

  const totalMin = (() => {
    // Amplitude de la visite : chaque personne enchaîne ses prestations, en parallèle des autres.
    const perPerson = new Map<string, number>();
    for (const l of lines) perPerson.set(l.personKey, (perPerson.get(l.personKey) ?? 0) + lineDuration(l));
    return Math.max(0, ...perPerson.values());
  })();
  const totalPrice = lines.reduce((s, l) => s + linePrice(l), 0);

  const sameLines =
    lines.length === initialLines.length && lines.every((l, i) => l.key === initialLines[i].key);
  const dirty = day !== currentDay || salon !== detail.salon || chosenTime !== currentTime || !sameLines;
  const canConfirm = Boolean(chosenTime) && lines.length > 0 && notOffered.length === 0 && dirty;

  const blocker = !chosenTime
    ? "Choisissez un horaire."
    : lines.length === 0
      ? "Gardez au moins une prestation."
      : !dirty
        ? "Rien n'a changé."
        : null;

  /* ---- prestations ---- */

  const personLines = lines.filter((l) => l.personKey === person);
  const selectedIds = new Set(personLines.map((l) => l.prestationId));

  const toggle = (p: Prestation) => {
    const existing = personLines.find((l) => l.prestationId === p.id);
    if (existing) {
      setLines((list) => list.filter((l) => l.key !== existing.key));
      return;
    }
    // Une ligne retirée puis recochée retrouve sa place (et sa praticienne).
    const original = initialLines.find((l) => l.personKey === person && l.prestationId === p.id);
    setLines((list) => [...list, original ?? { key: newLineId(), personKey: person, prestationId: p.id }]);
  };

  const groups = useMemo(() => {
    const q = fold(query.trim());
    const visible = catalog.filter(
      (p) =>
        offered.has(p.id) &&
        (p.active || selectedIds.has(p.id)) &&
        (!q || fold(p.name).includes(q) || fold(categoryName(p.serviceId)).includes(q)),
    );
    return services
      .map((s) => ({ id: s.id, name: s.name, items: visible.filter((p) => p.serviceId === s.id) }))
      .filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, services, query, salon, person, lines]);

  /* ---- confirmation ---- */

  const confirm = () => {
    if (!chosenTime) return;
    const plan = planAt(ctx, items, chosenTime, false, overrides);
    if (!plan) return;
    const payer = people.find((p) => p.key === "__payer__")?.source;
    const next: RdvPrestation[] = plan.map((pl) => {
      const line = lines.find((l) => l.key === pl.key)!;
      const staff = pl.staffIds[0] ?? null;
      // 2ᵉ praticienne d'une prestation « à deux » : gardée si elle reste libre.
      const second = line.existing?.secondStaff;
      const keepSecond =
        second && second !== staff && alternativesFor(ctx, plan, pl).some((alt) => alt.id === second) ? second : null;
      if (line.existing) {
        return { ...line.existing, start: pl.start, staff, secondStaff: keepSecond };
      }
      const p = byId.get(line.prestationId)!;
      const who = people.find((x) => x.key === line.personKey)?.source ?? payer;
      const category = categoryName(p.serviceId);
      return {
        id: line.key,
        prestationId: p.id,
        category,
        name: p.name,
        durationMin: p.durationMin,
        price: p.priceFcfa,
        posteType: posteTypeForCategory(category),
        staff,
        start: pl.start,
        beneficiaryName: who?.beneficiaryName ?? detail.client.name,
        beneficiaryClientId: who?.beneficiaryClientId ?? null,
        beneficiaryKind: who?.beneficiaryKind,
      };
    });
    onConfirm({ date: `${day}T${chosenTime}:00`, salon, prestations: next });
  };

  const morning = times.filter((t) => t < "12:00");
  const afternoon = times.filter((t) => t >= "12:00" && t < "17:00");
  const evening = times.filter((t) => t >= "17:00");

  return (
    <Dialog open={open} onClose={onClose} labelledBy="resched-title" className="relative flex max-h-[90vh] max-w-3xl flex-col">
      <CloseButton onClick={onClose} className="top-4 right-4" />

      <header className="shrink-0 px-8 pt-7 pb-5">
        <h2 id="resched-title" className="text-[24px] font-semibold tracking-[-0.01em] text-base-content">
          Reprogrammer le rendez-vous
        </h2>
        <p className="mt-1 text-[15px] text-base-content/60">
          {detail.client.name} · actuellement {frFullDate(currentDay)} à {currentTime}, {salonConfig(detail.salon).name}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-8 pb-8">
        {/* Date */}
        <section aria-labelledby="resched-date">
          <h3 id="resched-date" className="mb-3 text-[17px] font-semibold text-base-content">
            Nouvelle date
          </h3>
          <DatePicker
            value={isoToDate(day)}
            minDate={isoToDate(TODAY_ISO)}
            onChange={(d) => setDay(dateToIso(d))}
            trigger={
              <button
                type="button"
                className="input h-14 w-full items-center gap-3 bg-base-100 text-left text-[17px] first-letter:uppercase"
              >
                <CalendarDays aria-hidden className="size-5 shrink-0 text-base-content/45" />
                <span className="first-letter:uppercase">{frFullDate(day)}</span>
              </button>
            }
          />
        </section>

        {/* Salon */}
        <section aria-labelledby="resched-salon">
          <h3 id="resched-salon" className="mb-3 text-[17px] font-semibold text-base-content">
            Salon
          </h3>
          <div role="radiogroup" aria-labelledby="resched-salon" className="grid grid-cols-2 gap-3">
            {salonConfigs
              .filter((s) => s.active)
              .map((s) => {
                const selected = s.id === salon;
                const hours = openingLabel(s.id, day);
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSalon(s.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-box border px-4 py-4 text-left transition",
                      selected
                        ? "border-primary bg-accent ring-1 ring-primary"
                        : "border-base-300 bg-base-100 hover:border-base-content/25",
                    )}
                  >
                    <MapPin aria-hidden className={cn("mt-0.5 size-5 shrink-0", selected ? "text-primary" : "text-base-content/45")} />
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold text-base-content">{s.name}</span>
                      <span className="block truncate text-sm text-base-content/60">{s.address}</span>
                      <span className={cn("mt-1 block text-sm", hours ? "text-base-content/70" : "font-medium text-error-600")}>
                        {hours ?? "Fermé ce jour-là"}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Horaire */}
        <section aria-labelledby="resched-time">
          <h3 id="resched-time" className="text-[17px] font-semibold text-base-content">
            Horaire
          </h3>
          <p className="mt-0.5 mb-3 text-sm text-base-content/60">
            Seuls les horaires où les praticiennes nécessaires sont libres sont proposés.
          </p>
          {!opening ? (
            <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
              {salonConfig(salon).name} est fermé {frFullDate(day)}. Choisissez un autre jour ou l&apos;autre salon.
            </p>
          ) : notOffered.length > 0 ? (
            <p className="rounded-box bg-warning-50 px-4 py-4 text-[15px] text-warning-800">
              {notOffered.map(lineName).join(", ")} {notOffered.length > 1 ? "ne sont pas proposées" : "n'est pas proposée"} à{" "}
              {salonConfig(salon).name}. Retirez-{notOffered.length > 1 ? "les" : "la"} dans « Prestations » ci-dessous ou
              gardez l&apos;autre salon.
            </p>
          ) : lines.length === 0 ? (
            <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
              Ajoutez au moins une prestation pour voir les horaires.
            </p>
          ) : times.length === 0 ? (
            <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
              Aucun horaire libre ce jour-là pour {lines.length > 1 ? "ces prestations" : "cette prestation"} : les
              praticiennes compétentes sont absentes ou déjà prises. Essayez un autre jour ou l&apos;autre salon.
            </p>
          ) : (
            <div className="space-y-3">
              {[
                ["Matin", morning],
                ["Après-midi", afternoon],
                ["Soir", evening],
              ].map(([label, list]) =>
                (list as string[]).length === 0 ? null : (
                  <div key={label as string} className="flex items-start gap-4">
                    <span className="w-24 shrink-0 pt-2.5 text-sm text-base-content/60">{label as string}</span>
                    <div className="flex flex-wrap gap-2">
                      {(list as string[]).map((t) => {
                        const selected = t === chosenTime;
                        const isCurrent = t === currentTime && day === currentDay && salon === detail.salon;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setTime(t)}
                            title={isCurrent ? "Horaire actuel" : undefined}
                            className={cn(
                              "h-10 min-w-[72px] rounded-field border px-3 text-[15px] font-medium tabular-nums transition",
                              selected
                                ? "border-primary bg-primary text-primary-content"
                                : "border-base-300 bg-base-100 text-base-content hover:border-base-content/30",
                              isCurrent && !selected && "border-dashed border-primary/60",
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* Prestations (repliées) */}
        <section aria-labelledby="resched-prestations" className="rounded-box border border-base-300">
          <button
            type="button"
            aria-expanded={editingOpen}
            onClick={() => setEditingOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <span className="min-w-0 flex-1">
              <span id="resched-prestations" className="block text-[17px] font-semibold text-base-content">
                Prestations
              </span>
              <span className="block truncate text-sm text-base-content/60">
                {lines.length === 0
                  ? "Aucune prestation"
                  : `${lines.length} prestation${lines.length > 1 ? "s" : ""} · ${durationLabel(totalMin)} · ${fcfa(totalPrice)}`}
                {!sameLines && " · modifiées"}
              </span>
            </span>
            <span className="text-[15px] font-medium text-secondary">{editingOpen ? "Replier" : "Modifier les prestations"}</span>
            <ChevronDown aria-hidden className={cn("size-4 text-secondary transition", editingOpen && "rotate-180")} />
          </button>

          {editingOpen && (
            <div className="border-t border-base-300 px-5 pt-4 pb-5">
              {people.length > 1 && (
                <div role="tablist" aria-label="Prestations de" className="-mt-1 mb-4 flex gap-6 border-b border-base-300">
                  {people.map((p) => {
                    const count = lines.filter((l) => l.personKey === p.key).length;
                    const active = p.key === person;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPerson(p.key)}
                        className={cn(
                          "-mb-px border-b-2 pb-2.5 text-[15px] font-medium transition",
                          active
                            ? "border-primary text-base-content"
                            : "border-transparent text-base-content/60 hover:text-base-content",
                        )}
                      >
                        {p.label} <span className="tabular-nums text-base-content/45">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {personLines.length > 0 && (
                <ul className="mb-4 flex flex-wrap gap-2" aria-label="Prestations choisies">
                  {personLines.map((l) => (
                    <li
                      key={l.key}
                      className="inline-flex items-center gap-2 rounded-full bg-accent py-1.5 pr-1.5 pl-3.5 text-sm font-medium text-secondary"
                    >
                      {lineName(l)}
                      <button
                        type="button"
                        aria-label={`Retirer ${lineName(l)}`}
                        onClick={() => setLines((list) => list.filter((x) => x.key !== l.key))}
                        className="flex size-6 items-center justify-center rounded-full text-secondary/70 hover:bg-base-100 hover:text-secondary"
                      >
                        <X aria-hidden className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une prestation"
                aria-label="Rechercher une prestation"
              />

              <div className="mt-3 max-h-[340px] overflow-y-auto rounded-field border border-base-300">
                {groups.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-base-content/60">
                    Aucune prestation ne correspond à « {query.trim()} ».
                  </p>
                ) : (
                  groups.map((g) => (
                    <div key={g.id}>
                      <p className="sticky top-0 z-10 bg-base-200 px-4 py-2 text-xs font-semibold tracking-wide text-base-content/60 uppercase">
                        {g.name}
                      </p>
                      <ul>
                        {g.items.map((p) => {
                          const checked = selectedIds.has(p.id);
                          const blockedBy = checked ? null : conflictWith(catalog, p.id, selectedIds);
                          const blockedName = blockedBy ? byId.get(blockedBy)?.name : null;
                          return (
                            <li key={p.id}>
                              <label
                                className={cn(
                                  "flex min-h-12 items-center gap-3 border-t border-base-300 px-4 py-2 first:border-t-0",
                                  blockedBy ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-base-200/60",
                                )}
                              >
                                <CheckboxPrimitive.Root
                                  checked={checked}
                                  disabled={Boolean(blockedBy)}
                                  onCheckedChange={() => toggle(p)}
                                  className="checkbox checkbox-primary size-5 shrink-0 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                >
                                  <CheckboxPrimitive.Indicator>
                                    <Check aria-hidden className="size-3.5 text-primary-content" strokeWidth={3} />
                                  </CheckboxPrimitive.Indicator>
                                </CheckboxPrimitive.Root>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] text-base-content">{p.name}</span>
                                  {blockedName && (
                                    <span className="block text-xs text-base-content/60">
                                      Ne peut pas être combinée avec {blockedName} lors de la même visite.
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 text-sm tabular-nums text-base-content/60">
                                  {durationLabel(p.durationMin)}
                                </span>
                                <span className="w-28 shrink-0 text-right text-[15px] font-medium tabular-nums text-base-content">
                                  {fcfa(p.priceFcfa)}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="flex shrink-0 items-center gap-4 border-t border-base-300 px-8 py-5">
        <p className="min-w-0 flex-1 text-sm text-base-content/60">
          {canConfirm && chosenTime ? (
            <>
              <span className="font-medium text-base-content">
                {shortDay(day)} à {chosenTime} · {salonConfig(salon).name}
              </span>
              <span className="block">La cliente sera prévenue par email.</span>
            </>
          ) : (
            blocker
          )}
        </p>
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button disabled={!canConfirm} onClick={confirm}>
          Confirmer la reprogrammation
        </Button>
      </footer>
    </Dialog>
  );
}
