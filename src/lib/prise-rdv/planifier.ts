import { isClosed, salonConfig, today, type SalonId, type Weekday } from "@/lib/mock/beautyandco";
import { TODAY_ISO, type PlanningData } from "@/lib/mock/planning";
import {
  coversWindow,
  minutesToTime,
  timeToMinutes,
  type RdvDetail,
} from "@/lib/mock/rendezvous";
import { canPerform, fullName, members } from "@/lib/mock/staff";
import { prestationAvailableAt, type Prestation } from "@/lib/mock/services";

/**
 * Le pont entre le parcours b&co recopié de point-de-vente et l'agenda réel du back-office : quels
 * horaires proposer, et quelle praticienne poser d'office sur chaque prestation — la moins chargée
 * ce jour-là parmi celles libres, modifiable ensuite parmi les seules libres. Même algorithme que
 * `point-de-vente/lib/prise-rdv/planifier.ts` ; seules les sources changent : compétences
 * (`canPerform`), présence jour par jour (`coversWindow`, planning live) et rendez-vous de session.
 * Une praticienne est identifiée par son nom complet, comme dans `RdvPrestation.staff`.
 */

/** Les ids de lieu du site b&co ↔ les `SalonId` du back-office. */
export const SALON_ID_BY_LOCATION: Record<string, SalonId> = { "sea-plaza": "seaplaza", almadies: "almadies" };
export const LOCATION_ID_BY_SALON: Record<string, string> = { seaplaza: "sea-plaza", almadies: "almadies" };

const SLOT_STEP = 30;

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

/** « Aujourd'hui » et « maintenant » du monde de démo (cf. `TODAY_ISO`, `today.currentTime`). */
export const DEMO_TODAY_ISO = TODAY_ISO;
const NOW_MIN = timeToMinutes(today.currentTime);

export type Praticienne = { id: string; name: string };

export type PlanItem = {
  /** `${personId}:${subServiceId}` — la clé du CartItem. */
  key: string;
  personId: string;
  serviceId: string;
  categoryId: string;
  durationMinutes: number;
  twoPractitionersEligible: boolean;
};

export type PlanLine = {
  key: string;
  personId: string;
  serviceId: string;
  start: string;
  durationMin: number;
  staffIds: string[];
};

type Interval = { start: number; end: number };

export type PlanContext = {
  date: string;
  salonId: SalonId;
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  /** Rendez-vous en cours de modification — ignoré comme occupation. */
  excludeRdvId?: string;
  /** Jours / horaires et périodes d'indisponibilité d'une prestation (réglés dans Services) ; absent = heures du salon. */
  availabilityOf?: (prestationId: string) => Pick<Prestation, "availability" | "unavailablePeriods"> | null | undefined;
};

const practitioners = () =>
  members
    .filter((m) => m.active && m.roles.includes("praticienne"))
    .map((m) => ({ memberId: m.id, name: fullName(m) }));

function busyAndLoad(ctx: PlanContext) {
  const busy = new Map<string, Interval[]>();
  const load = new Map<string, number>();
  for (const r of ctx.rdvs) {
    if (r.status === "annulé" || r.id === ctx.excludeRdvId) continue;
    if (r.date.slice(0, 10) !== ctx.date) continue;
    for (const p of r.prestations) {
      const start = timeToMinutes(p.start);
      for (const name of [p.staff, p.secondStaff]) {
        if (!name) continue;
        busy.set(name, [...(busy.get(name) ?? []), { start, end: start + p.durationMin }]);
        load.set(name, (load.get(name) ?? 0) + p.durationMin);
      }
    }
  }
  return { busy, load };
}

/** Heures d'ouverture du salon ce jour-là (`null` = fermé). */
function openingHours(ctx: PlanContext): { open: number; close: number } | null {
  if (isClosed(ctx.salonId, ctx.date)) return null;
  const day = salonConfig(ctx.salonId).hours[WEEKDAY_BY_JS_DAY[new Date(`${ctx.date}T00:00:00`).getDay()]];
  if (day.closed) return null;
  return { open: timeToMinutes(day.open), close: timeToMinutes(day.close) };
}

/** Praticiennes compétentes, présentes dans ce salon sur tout l'intervalle et libres. */
function freeStaff(ctx: PlanContext, busy: Map<string, Interval[]>, serviceId: string, iv: Interval): Praticienne[] {
  return practitioners()
    .filter((p) => canPerform(p.memberId, serviceId))
    .filter((p) => coversWindow(p.memberId, ctx.salonId, ctx.date, iv.start, iv.end - iv.start, ctx.planningData))
    .filter((p) => !(busy.get(p.name) ?? []).some((b) => iv.start < b.end && b.start < iv.end))
    .map((p) => ({ id: p.name, name: p.name }));
}

function lineDuration(item: PlanItem, twoPractitioners: boolean) {
  return twoPractitioners && item.twoPractitionersEligible ? Math.round(item.durationMinutes / 2) : item.durationMinutes;
}

/**
 * Pose toutes les prestations à partir de `start` : chaque personne enchaîne les siennes, les
 * personnes sont servies en parallèle (même lecture que le site). `overrides` garde les
 * praticiennes d'une ligne tant qu'elles restent libres ; le reste vient de `preferredStaffId` si
 * elle est libre, puis des moins chargées du jour. `null` ⇒ horaire impossible.
 */
export function planAt(
  ctx: PlanContext,
  items: PlanItem[],
  start: string,
  twoPractitioners: boolean,
  overrides: Record<string, string[]> = {},
  /** Praticienne à poser d'office quand elle est libre (créneau cliqué au Planning), avant la moins chargée. */
  preferredStaffId?: string,
): PlanLine[] | null {
  const hours = openingHours(ctx);
  if (!hours) return null;
  const { busy, load } = busyAndLoad(ctx);
  const lines: PlanLine[] = [];
  const byPerson = new Map<string, PlanItem[]>();
  for (const item of items) byPerson.set(item.personId, [...(byPerson.get(item.personId) ?? []), item]);

  for (const personItems of byPerson.values()) {
    let cursor = timeToMinutes(start);
    for (const item of personItems) {
      // « 2 praticiennes » est une préférence, jamais une contrainte (comme point-de-vente) : une
      // prestation réalisable à 2 passe à deux (durée divisée) quand deux praticiennes sont libres
      // ensemble, sinon elle reste à une seule, durée pleine. L'option ne retire jamais un horaire.
      const fits = (iv: Interval) =>
        iv.start >= hours.open &&
        iv.end <= hours.close &&
        prestationAvailableAt(ctx.availabilityOf?.(item.serviceId), ctx.date, iv.start, iv.end);
      const tryDuo = twoPractitioners && item.twoPractitionersEligible;
      let durationMin = lineDuration(item, twoPractitioners);
      let iv = { start: cursor, end: cursor + durationMin };
      let free = fits(iv) ? freeStaff(ctx, busy, item.serviceId, iv) : [];
      let need = tryDuo ? 2 : 1;
      if (tryDuo && free.length < 2) {
        durationMin = item.durationMinutes;
        iv = { start: cursor, end: cursor + durationMin };
        free = fits(iv) ? freeStaff(ctx, busy, item.serviceId, iv) : [];
        need = 1;
      }
      if (!fits(iv) || free.length < need) return null;
      // Les praticiennes voulues encore libres d'abord (une prestation passée à deux garde la
      // sienne et en reçoit une 2ᵉ), complétées par la préférée puis les moins chargées.
      const wanted = (overrides[item.key] ?? []).filter((id) => free.some((p) => p.id === id)).slice(0, need);
      const chosen = [
        ...wanted,
        ...[...free]
          .filter((p) => !wanted.includes(p.id))
          .sort(
            (a, b) =>
              Number(b.id === preferredStaffId) - Number(a.id === preferredStaffId) ||
              (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) ||
              a.name.localeCompare(b.name),
          )
          .slice(0, need - wanted.length)
          .map((p) => p.id),
      ];
      for (const id of chosen) {
        busy.set(id, [...(busy.get(id) ?? []), iv]);
        load.set(id, (load.get(id) ?? 0) + durationMin);
      }
      lines.push({ key: item.key, personId: item.personId, serviceId: item.serviceId, start: minutesToTime(cursor), durationMin, staffIds: chosen });
      cursor = iv.end;
    }
  }
  return lines;
}

/** Les horaires proposables ce jour-là : toutes les demi-heures d'ouverture où tout le panier tient. */
export function availableTimes(ctx: PlanContext, items: PlanItem[], twoPractitioners: boolean): string[] {
  if (items.length === 0) return [];
  const hours = openingHours(ctx);
  if (!hours) return [];
  const isToday = ctx.date === DEMO_TODAY_ISO;
  const times: string[] = [];
  for (let t = hours.open; t < hours.close; t += SLOT_STEP) {
    if (isToday && t <= NOW_MIN) continue;
    if (planAt(ctx, items, minutesToTime(t), twoPractitioners)) times.push(minutesToTime(t));
  }
  return times;
}

/** Pour le choix manuel d'une ligne : les praticiennes libres sur son intervalle, le reste du plan tenu. */
export function alternativesFor(ctx: PlanContext, plan: PlanLine[], line: PlanLine): Praticienne[] {
  const { busy } = busyAndLoad(ctx);
  for (const other of plan) {
    if (other.key === line.key) continue;
    const s = timeToMinutes(other.start);
    for (const id of other.staffIds) busy.set(id, [...(busy.get(id) ?? []), { start: s, end: s + other.durationMin }]);
  }
  const s = timeToMinutes(line.start);
  return freeStaff(ctx, busy, line.serviceId, { start: s, end: s + line.durationMin });
}
