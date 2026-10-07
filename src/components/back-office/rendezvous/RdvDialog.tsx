"use client";

import { useMemo, useRef, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CalendarDays, Check, ChevronDown, MapPin, Minus, Plus, UserRound, Users, X } from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { DatePicker } from "@/components/ui/molecules/date-picker";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { Button } from "@/components/ui/atoms/button";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Switch } from "@/components/ui/atoms/switch";
import { Textarea } from "@/components/ui/atoms/textarea";
import { cn } from "@/lib/utils";
import { useServicesData } from "@/components/back-office/services/ServicesData";
import { NewClientDialog, type NewClientPrefill } from "@/components/back-office/ClientEditDialogs";
import RdvQuestions, { missingAnswers, type RdvQuestionPerson } from "@/components/back-office/rendezvous/RdvQuestions";
import { useClientsData } from "@/context/ClientsContext";
import {
  clientMatchesQuery,
  clientNumberLabel,
  isClosed,
  salonConfig,
  salonConfigs,
  today,
  type ClientRow,
  type SalonId,
  type Weekday,
} from "@/lib/mock/beautyandco";
import { TODAY_ISO, type PlanningData } from "@/lib/mock/planning";
import {
  boissonSeeds,
  conflictWith,
  durationLabel,
  prestationsForSalon,
  productPrice,
  products,
  type Prestation,
  type PrestationAnswer,
  type PrestationQuestion,
} from "@/lib/mock/services";
import {
  beneficiaryKey,
  fcfa,
  frFullDate,
  newRdvId,
  posteTypeForCategory,
  type RdvDetail,
  type RdvExtra,
  type RdvPrestation,
  type RdvQuestion,
} from "@/lib/mock/rendezvous";
import {
  BOOKING_QUESTIONS,
  answersFromQuestions,
  questionsFromAnswers,
  rdvAnswerKey,
  type RdvAnswers,
} from "@/lib/mock/booking-questions";
import { availableTimes, planAt, type PlanContext, type PlanItem } from "@/lib/prise-rdv/planifier";

// Le bloc unique de rendez-vous, même fenêtre que point-de-vente (ADR 0041 de point-de-vente) :
// « Nouveau rendez-vous » (sans `detail`) et « Modifier le rendez-vous » (avec `detail`), large,
// en deux colonnes vues d'un coup — à gauche le rendez-vous (cliente en création, prestations par
// personne, date et salon, horaire), à droite ce qui l'accompagne (2 praticiennes, questions,
// extensions, Bar Beauty, notes). Les praticiennes suivent (affectation automatique) : à la
// modification, l'actuelle est gardée si elle reste libre. « 2 praticiennes » est un seul
// interrupteur, appliqué là où c'est faisable : prestations réalisables à 2, quand deux
// praticiennes sont libres ensemble — il ne retire jamais un horaire. À la modification, tout
// s'ouvre replié.

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

type LineAnswers = Record<string, Record<string, string>>;

// `source` : une prestation existante de la personne (modification) ;
// absente pour la payeuse d'un nouveau rendez-vous ou une personne ajoutée.
type Person = { key: string; label: string; source?: RdvPrestation; added?: boolean };

const PAYER = "__payer__";

// Les extensions proposées quand une cliente coiffure n'apporte pas les siennes (règle du site
// b&co, `needsSalonExtensions`) : les cheveux vendus en boutique.
const EXTENSION_BRANDS = new Set(["beccy-wave", "nefertiti"]);
const extensionProducts = products.filter((p) => EXTENSION_BRANDS.has(p.brand) && p.priceFcfa);

let seq = 1;
const newLineId = () => `p-rdv-${Date.now().toString(36)}-${seq++}`;
let refSeq = 6000;

function openingLabel(salonId: SalonId, iso: string): string | null {
  if (isClosed(salonId, iso)) return null;
  const day = salonConfig(salonId).hours[WEEKDAY_BY_JS_DAY[isoToDate(iso).getDay()]];
  return day.closed ? null : `Ouvert de ${day.open} à ${day.close}`;
}

export type Reschedule = {
  date: string;
  salon: SalonId;
  prestations: RdvPrestation[];
  extras: RdvExtra[];
  questions: RdvQuestion[];
  staffNote?: string;
};

/** Créneau cliqué au Planning : jour, heure et praticienne (nom complet) posée d'office si libre. */
export type PickedSlot = { iso: string; time: string; staffName?: string };

type Props = {
  open: boolean;
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  onClose: () => void;
} & (
  | {
      /** Modification du rendez-vous existant. */
      detail: RdvDetail;
      onConfirm: (next: Reschedule) => void;
    }
  | {
      detail?: undefined;
      /** Création : payeuse, salon et créneau pré-remplis (tous modifiables). */
      initialClientId?: string;
      defaultSalonId?: SalonId | null;
      pickedSlot?: PickedSlot;
      onCreate: (rdv: RdvDetail) => void;
    }
);

export default function RdvDialog(props: Props) {
  if (!props.open) return null;
  return <RdvDialogBody key={props.detail?.id ?? "new"} {...props} />;
}

function RdvDialogBody(props: Props) {
  const { rdvs, planningData, onClose } = props;
  const detail = props.detail ?? null;
  const create = props.detail ? null : props;
  const isCreate = !detail;

  const { services, prestations: catalog } = useServicesData();
  const { rows: clientRows, createClient } = useClientsData();
  const activeSalons = salonConfigs.filter((s) => s.active);
  const currentDay = detail ? detail.date.slice(0, 10) : null;
  const currentTime = detail ? detail.date.slice(11, 16) : null;

  /* ---- cliente (création) ---- */

  const allClients = clientRows("all");
  const [clientId, setClientId] = useState<string | null>(create?.initialClientId ?? null);
  const client: ClientRow | null = clientId ? (allClients.find((c) => c.id === clientId) ?? null) : null;
  const payerName = detail ? detail.client.name : (client?.name ?? "Cliente");

  // Personnes servies, dans l'ordre du rendez-vous (la payeuse d'abord).
  const initialPeople = useMemo<Person[]>(() => {
    if (!detail) return [{ key: PAYER, label: "Cliente" }];
    const map = new Map<string, Person>();
    for (const p of [...detail.prestations].sort((a, b) => a.start.localeCompare(b.start))) {
      const key = beneficiaryKey(p, detail.client.name);
      if (!map.has(key)) map.set(key, { key, label: p.beneficiaryName || detail.client.name, source: p });
    }
    return [...map.values()].sort((a, b) => Number(b.key === PAYER) - Number(a.key === PAYER));
  }, [detail]);

  const initialLines = useMemo<Line[]>(
    () =>
      detail
        ? [...detail.prestations]
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((p) => ({
              key: p.id,
              personKey: beneficiaryKey(p, detail.client.name),
              prestationId: p.prestationId,
              existing: p,
            }))
        : [],
    [detail],
  );

  const [day, setDay] = useState(currentDay ?? create?.pickedSlot?.iso ?? TODAY_ISO);
  const [salon, setSalon] = useState<SalonId>(
    detail?.salon ?? create?.defaultSalonId ?? activeSalons[0]?.id ?? "almadies",
  );
  const [time, setTime] = useState<string | null>(currentTime ?? create?.pickedSlot?.time ?? null);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  // Un nouveau rendez-vous n'a rien à résumer : les prestations sont ouvertes d'emblée.
  const [editingOpen, setEditingOpen] = useState(isCreate);
  const [person, setPerson] = useState(initialPeople[0]?.key ?? PAYER);
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);
  const searching = query.trim() !== "";
  const [newClient, setNewClient] = useState<NewClientPrefill | null>(null);
  const personLabel = (p: Person) => (p.key === PAYER ? payerName : p.label);
  const addedName = (p: Person, i: number) => p.label.trim() || `Personne ${i + 1}`;

  // Réponses aux questions de catégorie (reprises du rendez-vous), 2 praticiennes, extras, note.
  const initialAnswers = useMemo<RdvAnswers>(() => answersFromQuestions(detail?.questions ?? []), [detail]);
  const [answers, setAnswers] = useState<RdvAnswers>(initialAnswers);
  const answer = (personKey: string, serviceId: string, questionId: string, value: string) =>
    setAnswers((prev) => {
      const k = rdvAnswerKey(personKey, serviceId);
      return { ...prev, [k]: { ...(prev[k] ?? {}), [questionId]: value } };
    });
  const initialDuo = (detail?.prestations ?? []).some((p) => p.secondStaff);
  const [duo, setDuo] = useState(initialDuo);
  const initialExtras = detail?.extras ?? [];
  const [extras, setExtras] = useState<RdvExtra[]>(initialExtras);
  const extraQty = (productId: string) => extras.find((x) => x.productId === productId)?.qty ?? 0;
  const setExtraQty = (kind: RdvExtra["kind"], productId: string, qty: number) =>
    setExtras((list) => {
      const current = list.find((x) => x.productId === productId);
      const rest = list.filter((x) => x.productId !== productId);
      return qty > 0 ? [...rest, { id: current?.id ?? `ex-${newLineId()}`, kind, productId, qty }] : rest;
    });
  const extrasTotal = extras.reduce((sum, x) => sum + productPrice(x.productId) * x.qty, 0);
  const initialStaffNote = detail?.staffNote ?? "";
  const [staffNote, setStaffNote] = useState(initialStaffNote);

  // Réponses aux questions de prestation (`Prestation.questions`), par ligne :
  // { [clé de ligne]: { [id de question]: id de réponse } }. Reprises des
  // `answers` du rendez-vous en modification ; décocher la ligne les efface.
  const initialLineAnswers = useMemo<LineAnswers>(
    () =>
      Object.fromEntries(
        (detail?.prestations ?? [])
          .filter((p) => p.answers?.length)
          .map((p) => [p.id, Object.fromEntries(p.answers!.map((a) => [a.questionId, a.optionId]))]),
      ),
    [detail],
  );
  const [lineAnswers, setLineAnswers] = useState<LineAnswers>(initialLineAnswers);
  const pick = (lineKey: string, questionId: string, optionId: string) =>
    setLineAnswers((prev) => ({ ...prev, [lineKey]: { ...(prev[lineKey] ?? {}), [questionId]: optionId } }));
  const forgetLine = (lineKey: string) =>
    setLineAnswers((prev) => {
      if (!(lineKey in prev)) return prev;
      const next = { ...prev };
      delete next[lineKey];
      return next;
    });
  const dropLine = (lineKey: string) => {
    setLines((list) => list.filter((l) => l.key !== lineKey));
    forgetLine(lineKey);
  };
  // Où défiler quand on clique le motif « Choisissez… » du pied.
  const questionRefs = useRef(new Map<string, HTMLDivElement>());

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const categoryName = (serviceId: string | null) =>
    services.find((s) => s.id === serviceId)?.name ?? "Autres prestations";
  const subcategoryName = (p: Prestation) =>
    services.find((s) => s.id === p.serviceId)?.subcategories.find((sc) => sc.id === p.subcategoryId)?.name ?? null;

  // Durée seule d'une ligne : celle du rendez-vous pour une ligne gardée (celle du catalogue si
  // elle était à deux, sa durée y étant déjà divisée), celle du catalogue pour une ligne ajoutée.
  const soloDuration = (l: Line) => {
    const fromCatalog = byId.get(l.prestationId)?.durationMin;
    if (l.existing && !l.existing.secondStaff) return l.existing.durationMin;
    return fromCatalog ?? (l.existing ? l.existing.durationMin * 2 : 0);
  };
  const canDuo = (l: Line) => Boolean(byId.get(l.prestationId)?.twoPractitioners);
  const linePrice = (l: Line) => l.existing?.price ?? byId.get(l.prestationId)?.priceFcfa ?? 0;
  const lineName = (l: Line) => l.existing?.name ?? byId.get(l.prestationId)?.name ?? "Prestation";
  // Questions de la prestation : celles du catalogue de session (une réponse dont
  // l'option a disparu ne compte plus).
  const questionsOf = (l: Line): PrestationQuestion[] => byId.get(l.prestationId)?.questions ?? [];
  const chosenOption = (l: Line, q: PrestationQuestion) => {
    const id = lineAnswers[l.key]?.[q.id];
    return q.options.find((o) => o.id === id) ?? null;
  };
  const unansweredOf = (l: Line) => questionsOf(l).filter((q) => !chosenOption(l, q));
  const answersFor = (l: Line): PrestationAnswer[] | undefined => {
    const qs = questionsOf(l);
    if (qs.length === 0) return l.existing?.answers;
    return qs.flatMap((q) => {
      const o = chosenOption(l, q);
      return o ? [{ questionId: q.id, question: q.label, optionId: o.id, option: o.label, photo: o.photo }] : [];
    });
  };

  const ctx: PlanContext = useMemo(
    () => ({
      date: day,
      salonId: salon,
      rdvs,
      planningData,
      excludeRdvId: detail?.id,
      availabilityOf: (id) => byId.get(id),
    }),
    [day, salon, rdvs, planningData, detail?.id, byId],
  );

  const items: PlanItem[] = lines.map((l) => ({
    key: l.key,
    personId: l.personKey,
    serviceId: l.prestationId,
    categoryId: byId.get(l.prestationId)?.serviceId ?? "",
    durationMinutes: soloDuration(l),
    twoPractitionersEligible: canDuo(l),
  }));
  // Les intervenantes actuelles sont gardées tant qu'elles restent libres.
  const overrides = Object.fromEntries(
    lines
      .filter((l) => l.existing?.staff)
      .map((l) => [l.key, [l.existing!.staff!, ...(l.existing!.secondStaff ? [l.existing!.secondStaff] : [])]]),
  );

  // Prestations que le salon choisi ne propose pas : bloquant, dit en clair.
  const offered = new Set(prestationsForSalon(catalog, salon).map((p) => p.id));
  const notOffered = lines.filter((l) => !offered.has(l.prestationId));

  const opening = openingLabel(salon, day);
  const itemsKey = JSON.stringify(items);
  const times = useMemo(
    () => (opening && notOffered.length === 0 ? availableTimes(ctx, items, duo) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, opening, notOffered.length, itemsKey, duo],
  );
  const chosenTime = time && times.includes(time) ? time : null;
  // Le plan à l'horaire choisi : dit où « 2 praticiennes » s'applique vraiment.
  const plan = useMemo(
    () => (chosenTime ? planAt(ctx, items, chosenTime, duo, overrides, create?.pickedSlot?.staffName) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, chosenTime, itemsKey, duo],
  );
  const planned = (l: Line) => plan?.find((pl) => pl.key === l.key);
  // Durée réelle d'une ligne : celle du plan ; sans horaire, à deux dès que l'interrupteur et la prestation le permettent.
  const lineDuration = (l: Line) =>
    planned(l)?.durationMin ?? (duo && canDuo(l) ? Math.round(soloDuration(l) / 2) : soloDuration(l));
  const duoEligible = lines.filter(canDuo);

  // Amplitude de la visite : chaque personne enchaîne ses prestations, en parallèle des autres.
  const visit = (minutesOf: (l: Line) => number) => {
    const perPerson = new Map<string, number>();
    for (const l of lines) perPerson.set(l.personKey, (perPerson.get(l.personKey) ?? 0) + minutesOf(l));
    return Math.max(0, ...perPerson.values());
  };
  const totalMin = visit(lineDuration);
  const soloTotalMin = visit(soloDuration);
  // La visite au mieux, si toutes les prestations éligibles passent à deux : le temps que l'option peut faire gagner.
  const duoBestMin = visit((l) => (canDuo(l) ? Math.round(soloDuration(l) / 2) : soloDuration(l)));
  // Ce que le bloc annonce : le plan réel à l'horaire choisi quand l'option est allumée, sinon le meilleur cas.
  const duoGainMin = duo && plan ? totalMin : duoBestMin;
  const totalPrice = lines.reduce((s, l) => s + linePrice(l), 0) + extrasTotal;

  const sameLines = lines.length === initialLines.length && lines.every((l, i) => l.key === initialLines[i].key);
  // Personnes servies × catégories choisies : ce sur quoi portent les questions.
  const questionPeople: RdvQuestionPerson[] = people
    .map((p, i) => ({
      key: p.key,
      label: p.added ? addedName(p, i) : personLabel(p),
      serviceIds: services
        .map((s) => s.id)
        .filter((sid) => BOOKING_QUESTIONS[sid] && lines.some((l) => l.personKey === p.key && byId.get(l.prestationId)?.serviceId === sid)),
    }))
    .filter((p) => p.serviceIds.length > 0);
  const unanswered = missingAnswers(questionPeople, answers);
  const dirty =
    isCreate ||
    day !== currentDay ||
    salon !== detail?.salon ||
    chosenTime !== currentTime ||
    !sameLines ||
    duo !== initialDuo ||
    JSON.stringify(extras) !== JSON.stringify(initialExtras) ||
    JSON.stringify(answers) !== JSON.stringify(initialAnswers) ||
    JSON.stringify(lineAnswers) !== JSON.stringify(initialLineAnswers) ||
    staffNote.trim() !== initialStaffNote.trim();
  // Première question de prestation sans réponse (le motif du pied y mène).
  const pendingQuestions = lines.flatMap((l) => unansweredOf(l).map((q) => ({ line: l, question: q })));
  const firstPending = pendingQuestions[0] ?? null;
  const personNameOf = (key: string) => {
    const i = people.findIndex((p) => p.key === key);
    const p = people[i];
    return !p ? payerName : p.added ? addedName(p, i) : personLabel(p);
  };
  // Une personne ajoutée qui a des prestations doit porter son nom complet.
  const unnamed = people.filter((p) => p.added && !p.label.trim() && lines.some((l) => l.personKey === p.key));
  const canConfirm =
    (!isCreate || Boolean(client)) &&
    Boolean(chosenTime) &&
    lines.length > 0 &&
    notOffered.length === 0 &&
    unnamed.length === 0 &&
    pendingQuestions.length === 0 &&
    dirty;

  const blocker =
    isCreate && !client
      ? "Choisissez la cliente."
      : lines.length === 0
        ? isCreate
          ? "Choisissez au moins une prestation."
          : "Gardez au moins une prestation."
        : unnamed.length > 0
          ? "Saisissez le nom complet de chaque personne ajoutée."
          : firstPending
            ? `Choisissez une réponse pour ${lineName(firstPending.line)}${people.length > 1 ? ` (${personNameOf(firstPending.line.personKey)})` : ""}.`
          : !chosenTime
            ? "Choisissez un horaire."
            : !dirty
              ? "Rien n'a changé."
              : null;

  // En modification tout s'ouvre replié : le détail « 2 praticiennes » n'apparaît qu'une fois
  // le créneau, les prestations ou l'interrupteur touchés.
  const showDuoDetail =
    isCreate || duo !== initialDuo || chosenTime !== currentTime || day !== currentDay || salon !== detail?.salon || !sameLines;

  // Ouvre la prestation qui attend une réponse et y fait défiler la colonne.
  const goToPending = () => {
    if (!firstPending) return;
    const { line } = firstPending;
    setEditingOpen(true);
    setQuery("");
    setPerson(line.personKey);
    setOpenCat(byId.get(line.prestationId)?.serviceId ?? null);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        questionRefs.current.get(line.key)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      ),
    );
  };

  /* ---- prestations ---- */

  const personLines = lines.filter((l) => l.personKey === person);
  const activePerson = people.find((p) => p.key === person);

  const addPerson = () => {
    const key = `new-${Date.now().toString(36)}-${seq++}`;
    setPeople((list) => [...list, { key, label: "", added: true }]);
    setPerson(key);
  };
  const removePerson = (key: string) => {
    setPeople((list) => list.filter((p) => p.key !== key));
    lines.filter((l) => l.personKey === key).forEach((l) => forgetLine(l.key));
    setLines((list) => list.filter((l) => l.personKey !== key));
    setPerson(PAYER);
  };
  const renamePerson = (key: string, label: string) =>
    setPeople((list) => list.map((p) => (p.key === key ? { ...p, label } : p)));
  const selectedIds = new Set(personLines.map((l) => l.prestationId));

  const toggle = (p: Prestation) => {
    const existing = personLines.find((l) => l.prestationId === p.id);
    if (existing) {
      dropLine(existing.key);
      return;
    }
    // Une ligne retirée puis recochée retrouve sa place (et sa praticienne).
    const original = initialLines.find((l) => l.personKey === person && l.prestationId === p.id);
    setLines((list) => [...list, original ?? { key: newLineId(), personKey: person, prestationId: p.id }]);
  };

  // Extensions : dès qu'une personne en coiffure n'apporte pas les siennes — ou déjà réservées.
  const showExtensions =
    people.some(
      (p) =>
        lines.some((l) => l.personKey === p.key && byId.get(l.prestationId)?.serviceId === "s-coiffure") &&
        answers[rdvAnswerKey(p.key, "s-coiffure")]?.["propres-extensions"] === "Non",
    ) || extras.some((x) => extensionProducts.some((p) => p.id === x.productId));

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
    if (!chosenTime || !plan) return;
    const payer = people.find((p) => p.key === PAYER)?.source;
    // Clé définitive de chaque personne, celle que `beneficiaryKey` relira à la prochaine modification.
    const finalKey = (p: Person, i: number) => (p.added ? addedName(p, i) : p.key);
    const next: RdvPrestation[] = plan.map((pl) => {
      const line = lines.find((l) => l.key === pl.key)!;
      const [staff = null, secondStaff = null] = pl.staffIds;
      if (line.existing) {
        return { ...line.existing, start: pl.start, durationMin: pl.durationMin, staff, secondStaff, answers: answersFor(line) };
      }
      const p = byId.get(line.prestationId)!;
      const personIndex = people.findIndex((x) => x.key === line.personKey);
      const target = people[personIndex];
      const who = target?.source ?? (target?.added ? undefined : payer);
      const category = categoryName(p.serviceId);
      return {
        id: line.key,
        prestationId: p.id,
        category,
        name: p.name,
        durationMin: pl.durationMin,
        price: p.priceFcfa,
        posteType: posteTypeForCategory(category),
        staff,
        secondStaff,
        start: pl.start,
        beneficiaryName: target?.added ? addedName(target, personIndex) : (who?.beneficiaryName ?? payerName),
        beneficiaryClientId: who?.beneficiaryClientId ?? null,
        beneficiaryKind: who?.beneficiaryKind,
        answers: answersFor(line),
      };
    });
    const questions = questionsFromAnswers(
      questionPeople.map((qp) => {
        const i = people.findIndex((p) => p.key === qp.key);
        const key = finalKey(people[i], i);
        return { ...qp, key };
      }),
      Object.fromEntries(
        Object.entries(answers).map(([k, v]) => {
          const [pk, sid] = [k.slice(0, k.lastIndexOf(":")), k.slice(k.lastIndexOf(":") + 1)];
          const i = people.findIndex((p) => p.key === pk);
          return [rdvAnswerKey(i >= 0 ? finalKey(people[i], i) : pk, sid), v];
        }),
      ),
      detail?.questions ?? [],
    );
    const note = staffNote.trim() || undefined;
    const date = `${day}T${chosenTime}:00`;
    if (!create) {
      if (props.detail) props.onConfirm({ date, salon, prestations: next, extras, questions, staffNote: note });
      return;
    }
    if (!client) return;
    const staffSet = new Set(next.map((p) => p.staff));
    create.onCreate({
      id: newRdvId(),
      ref: `#bo-${refSeq++}`,
      status: "à venir",
      date: `${day}T${[...next].map((p) => p.start).sort()[0] ?? chosenTime}:00`,
      salon,
      salonLabel: salonConfig(salon).name,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        whatsapp: client.whatsapp,
        loyaltyPoints: client.loyaltyPoints,
      },
      staffGlobal: staffSet.size === 1 ? next[0].staff : null,
      prestations: next,
      extras,
      questions,
      advantages: [],
      staffNote: note,
      events: [{ at: `${TODAY_ISO}T${today.currentTime}:00`, label: "Rendez-vous créé", detail: "Saisi au salon" }],
    });
  };

  return (
    <>
      <Dialog open onClose={onClose} labelledBy="resched-title" className="relative flex h-[90vh] max-w-[1200px] flex-col overflow-hidden">
        <CloseButton onClick={onClose} className="top-4 right-4" />

        <header className="shrink-0 border-b border-base-300 px-8 pt-7 pb-5">
          <h2 id="resched-title" className="text-[24px] font-semibold tracking-[-0.01em] text-base-content">
            {isCreate ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}
          </h2>
          {detail && (
            <p className="mt-1 text-[15px] text-base-content/60">
              {`${detail.client.name} · actuellement ${frFullDate(currentDay!)} à ${currentTime}, ${salonConfig(detail.salon).name}`}
            </p>
          )}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_440px]">
          {/* ---- Le rendez-vous ---- */}
          <div className="min-h-0 space-y-8 overflow-y-auto px-8 pt-6 pb-8">
            {isCreate && (
              <ClientPicker clients={allClients} value={client} onChange={setClientId} onCreateNew={(prefill) => setNewClient(prefill)} />
            )}

            {/* Prestations (repliées à la modification : on y vient surtout pour l'horaire) */}
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
                      : `${lines.length} prestation${lines.length > 1 ? "s" : ""} · ${durationLabel(totalMin)} · ${fcfa(totalPrice - extrasTotal)}`}
                    {!isCreate && !sameLines && " · modifiées"}
                    {pendingQuestions.length > 0 && (
                      <span className="text-warning-700">
                        {` · ${pendingQuestions.length} réponse${pendingQuestions.length > 1 ? "s" : ""} à choisir`}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-[15px] font-medium text-secondary">{editingOpen ? "Replier" : "Modifier les prestations"}</span>
                <ChevronDown aria-hidden className={cn("size-4 text-secondary transition", editingOpen && "rotate-180")} />
              </button>

              {editingOpen && (
                <div className="border-t border-base-300 px-5 pt-4 pb-5">
                  <div className="-mt-1 mb-4 flex items-end gap-6 border-b border-base-300">
                    <div role="tablist" aria-label="Prestations de" className="flex min-w-0 gap-6">
                      {people.map((p, i) => {
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
                              "-mb-px truncate border-b-2 pb-2.5 text-[15px] font-medium transition",
                              active ? "border-primary text-base-content" : "border-transparent text-base-content/60 hover:text-base-content",
                            )}
                          >
                            {p.added ? addedName(p, i) : personLabel(p)} <span className="tabular-nums text-base-content/45">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={addPerson}
                      className="mb-2 ml-auto inline-flex shrink-0 items-center gap-1.5 text-[15px] font-medium text-secondary hover:underline"
                    >
                      <Plus aria-hidden className="size-4" />
                      Ajouter une personne
                    </button>
                  </div>

                  {activePerson?.added && (
                    <div className="mb-4 flex items-center gap-3">
                      <input
                        value={activePerson.label}
                        onChange={(e) => renamePerson(activePerson.key, e.target.value)}
                        placeholder="Nom complet de la personne"
                        aria-label="Nom complet de la personne"
                        aria-required
                        autoFocus
                        className="input h-11 flex-1 bg-base-100 text-[15px]"
                      />
                      <Button variant="outline" onClick={() => removePerson(activePerson.key)}>
                        Retirer cette personne
                      </Button>
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
                          {questionsOf(l).map((q) => {
                            const o = chosenOption(l, q);
                            return o ? (
                              <span key={q.id} className="font-normal text-secondary/80">
                                · {o.label}
                              </span>
                            ) : (
                              <span key={q.id} className="font-normal text-warning-700">
                                · à préciser
                              </span>
                            );
                          })}
                          {(planned(l)?.staffIds.length ?? 0) > 1 && <Users aria-label="à 2 praticiennes" className="size-3.5" />}
                          <button
                            type="button"
                            aria-label={`Retirer ${lineName(l)}`}
                            onClick={() => dropLine(l.key)}
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

                  <div className="mt-3 divide-y divide-base-300 rounded-field border border-base-300">
                    {groups.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-base-content/60">
                        Aucune prestation ne correspond à « {query.trim()} ».
                      </p>
                    ) : (
                      groups.map((g) => {
                        // Une seule catégorie ouverte à la fois ; une recherche ouvre toutes celles qui ont un résultat.
                        const isOpen = searching || openCat === g.id;
                        const chosen = personLines.filter((l) => byId.get(l.prestationId)?.serviceId === g.id).length;
                        return (
                          <div key={g.id}>
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              disabled={searching}
                              onClick={() => setOpenCat(isOpen ? null : g.id)}
                              className={cn(
                                "flex h-14 w-full items-center gap-3 px-4 text-left transition enabled:hover:bg-base-200/60",
                                // -top-6 : la colonne défile avec un pt-6, que le collage retire de sa zone.
                                isOpen && "sticky -top-6 z-10 border-b border-base-300 bg-base-200",
                              )}
                            >
                              <span className="text-[16px] font-semibold text-base-content">{g.name}</span>
                              {chosen > 0 && <CountBadge n={chosen} />}
                              {!searching && (
                                <ChevronDown aria-hidden className={cn("ml-auto size-5 text-secondary transition", isOpen && "rotate-180")} />
                              )}
                            </button>
                            {isOpen &&
                              subGroups(g.items, subcategoryName).map((sg) => (
                                <div key={sg.name ?? "_"}>
                                  {sg.name && (
                                    <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-base-content/50 uppercase">
                                      {sg.name}
                                    </p>
                                  )}
                                  <ul>
                                    {sg.items.map((p) => {
                                      const checked = selectedIds.has(p.id);
                                      const blockedBy = checked ? null : conflictWith(catalog, p.id, selectedIds);
                                      const blockedName = blockedBy ? byId.get(blockedBy)?.name : null;
                                      return (
                                        <li key={p.id}>
                                          <label
                                            className={cn(
                                              "flex min-h-12 items-center gap-3 px-4 py-2",
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
                                              <span className="block text-[15px] text-base-content">
                                                {p.name}
                                                {p.twoPractitioners && (
                                                  <span
                                                    title="Réalisable à 2 praticiennes"
                                                    className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 align-middle text-xs font-medium whitespace-nowrap text-base-content/50"
                                                  >
                                                    <Users aria-hidden className="size-3.5" />à 2
                                                  </span>
                                                )}
                                              </span>
                                              {blockedName && (
                                                <span className="block text-xs text-base-content/60">
                                                  Ne peut pas être combinée avec {blockedName} lors de la même visite.
                                                </span>
                                              )}
                                            </span>
                                            <span className="shrink-0 text-sm tabular-nums text-base-content/60">
                                              {durationLabel(p.durationMin)}
                                            </span>
                                            <span className="w-32 shrink-0 text-right text-[15px] font-medium tabular-nums text-base-content">
                                              {fcfa(p.priceFcfa)}
                                            </span>
                                          </label>
                                          {checked &&
                                            (() => {
                                              const line = personLines.find((l) => l.prestationId === p.id);
                                              const qs = line ? questionsOf(line) : [];
                                              if (!line || qs.length === 0) return null;
                                              return (
                                                <div
                                                  ref={(el) => {
                                                    if (el) questionRefs.current.set(line.key, el);
                                                    else questionRefs.current.delete(line.key);
                                                  }}
                                                  className="scroll-mt-20 space-y-4 px-4 pt-1 pb-4 pl-12"
                                                >
                                                  {qs.map((q) => (
                                                    <AnswerTiles
                                                      key={q.id}
                                                      question={q}
                                                      value={chosenOption(line, q)?.id ?? null}
                                                      onChange={(optionId) => pick(line.key, q.id, optionId)}
                                                    />
                                                  ))}
                                                </div>
                                              );
                                            })()}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Date et salon, sur une rangée */}
            <div className="grid grid-cols-2 gap-6">
              <section aria-labelledby="resched-date">
                <h3 id="resched-date" className="mb-3 text-[17px] font-semibold text-base-content">
                  {isCreate ? "Date" : "Nouvelle date"}
                </h3>
                <DatePicker
                  value={isoToDate(day)}
                  minDate={isoToDate(TODAY_ISO)}
                  onChange={(d) => setDay(dateToIso(d))}
                  trigger={
                    <button type="button" className="input h-14 w-full items-center gap-3 bg-base-100 text-left text-[17px]">
                      <CalendarDays aria-hidden className="size-5 shrink-0 text-base-content/45" />
                      <span className="truncate first-letter:uppercase">{frFullDate(day)}</span>
                    </button>
                  }
                />
              </section>

              <section aria-labelledby="resched-salon">
                <h3 id="resched-salon" className="mb-3 text-[17px] font-semibold text-base-content">
                  Salon
                </h3>
                <div role="radiogroup" aria-labelledby="resched-salon" className="grid grid-cols-2 gap-2">
                  {activeSalons.map((s) => {
                    const selected = s.id === salon;
                    const closed = !openingLabel(s.id, day);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSalon(s.id)}
                        title={s.address}
                        className={cn(
                          "flex h-14 items-center gap-2.5 rounded-field border px-3 text-left transition",
                          selected ? "border-primary bg-accent ring-1 ring-primary" : "border-base-300 bg-base-100 hover:border-base-content/25",
                          closed && !selected && "bg-base-200 opacity-70",
                        )}
                      >
                        <MapPin aria-hidden className={cn("size-5 shrink-0", selected ? "text-primary" : "text-base-content/45")} />
                        <span className="min-w-0">
                          <span className="block truncate text-[16px] font-semibold text-base-content">{s.name}</span>
                          {closed && <span className="block text-xs font-medium whitespace-nowrap text-error-600">Fermé</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Horaire */}
            <section aria-labelledby="resched-time">
              <h3 id="resched-time" className="mb-3 text-[17px] font-semibold text-base-content">
                Horaire
              </h3>
              {!opening ? (
                <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
                  {salonConfig(salon).name} est fermé {frFullDate(day)}. Choisissez un autre jour ou l&apos;autre salon.
                </p>
              ) : notOffered.length > 0 ? (
                <p className="rounded-box bg-warning-50 px-4 py-4 text-[15px] text-warning-800">
                  {notOffered.map(lineName).join(", ")} {notOffered.length > 1 ? "ne sont pas proposées" : "n'est pas proposée"} à{" "}
                  {salonConfig(salon).name}. Retirez-{notOffered.length > 1 ? "les" : "la"} dans « Prestations » ou gardez
                  l&apos;autre salon.
                </p>
              ) : lines.length === 0 ? (
                <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
                  Ajoutez au moins une prestation pour voir les horaires.
                </p>
              ) : times.length === 0 ? (
                <p className="rounded-box bg-base-200 px-4 py-4 text-[15px] text-base-content/70">
                  Aucun horaire libre ce jour-là pour {lines.length > 1 ? "ces prestations" : "cette prestation"} : les praticiennes
                  compétentes sont absentes ou déjà prises. Essayez un autre jour ou l&apos;autre salon.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {times.map((t) => {
                    const selected = t === chosenTime;
                    const isCurrent = t === currentTime && day === currentDay && salon === detail?.salon;
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
              )}
            </section>
          </div>

          {/* ---- Ce qui l'accompagne ---- */}
          <aside
            aria-label="Options du rendez-vous"
            className="min-h-0 space-y-8 overflow-y-auto border-l border-base-300 bg-base-200/40 px-7 pt-6 pb-8"
          >
            {/* 2 praticiennes : un seul interrupteur, appliqué là où c'est faisable. Le bloc du site b&co :
                rose dès qu'une prestation y a droit, avec le temps gagné, et il tremble une fois. */}
            <section
              key={duoEligible.length > 0 ? "duo-eligible" : "duo-none"}
              aria-labelledby="rdv-duo"
              className={cn(
                "rounded-box p-[18px] transition-colors",
                duoEligible.length > 0 ? "bg-brand-100/40" : "bg-base-100 ring-1 ring-base-300",
                duoEligible.length > 0 && !duo && (isCreate || !sameLines) && "attention-shake-once",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span id="rdv-duo" className="block text-[17px] font-semibold text-base-content">
                    2 praticiennes
                  </span>
                  {duoEligible.length > 0 && duoGainMin < soloTotalMin && (
                    <span className="block text-[15px] tabular-nums text-base-content/70">
                      {durationLabel(soloTotalMin)} →{" "}
                      <span className="font-semibold text-brand-700">{durationLabel(duoGainMin)}</span>
                    </span>
                  )}
                </span>
                <Switch checked={duo} onChange={setDuo} disabled={duoEligible.length === 0 && !duo} label="2 praticiennes" />
              </div>
              {duo && duoEligible.length > 0 && plan && showDuoDetail && (
                <ul className="mt-3 space-y-1.5 rounded-field bg-base-100 px-4 py-3">
                  {duoEligible.map((l) => {
                    const two = (planned(l)?.staffIds.length ?? 0) > 1;
                    return (
                      <li key={l.key} className="flex items-start gap-2 text-sm">
                        {two ? (
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success-600" strokeWidth={2.5} />
                        ) : (
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-base-content/35" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="text-base-content">{lineName(l)}</span>
                          <span className="block text-base-content/60">
                            {two
                              ? `À 2 · ${durationLabel(lineDuration(l))} au lieu de ${durationLabel(soloDuration(l))}`
                              : `Reste à 1 : une seule praticienne libre à ${chosenTime}`}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Questions de catégorie (celles de la prise de RDV b&co) */}
            {questionPeople.length > 0 && (
              <Block
                id="rdv-questions"
                title="Questions"
                defaultOpen={isCreate}
                badge={unanswered > 0 ? <span className="text-sm font-normal text-base-content/50">{unanswered} sans réponse</span> : null}
              >
                <div className="p-4">
                  <RdvQuestions people={questionPeople} serviceName={categoryName} answers={answers} onAnswer={answer} />
                </div>
              </Block>
            )}

            {/* Extensions : quand une cliente coiffure n'apporte pas les siennes — déplié à la création, il y a à choisir */}
            {showExtensions && (
              <ExtraBlock
                id="rdv-extensions"
                title="Extensions"
                defaultOpen={isCreate}
                rows={extensionProducts.map((p) => ({ id: p.id, name: p.name, price: p.priceFcfa ?? 0, image: p.image }))}
                qty={extraQty}
                onQty={(id, q) => setExtraQty("produit", id, q)}
              />
            )}

            {/* Bar Beauty : toujours replié par défaut */}
            <ExtraBlock
              id="rdv-boissons"
              title="Bar Beauty"
              rows={boissonSeeds
                .filter((b) => b.active || extraQty(b.id) > 0)
                .map((b) => ({ id: b.id, name: b.name, price: b.priceFcfa, image: b.image, detail: b.description }))}
              qty={extraQty}
              onQty={(id, q) => setExtraQty("boisson", id, q)}
            />

            {/* Notes libres */}
            <Block
              id="rdv-note"
              title="Notes"
              defaultOpen={isCreate}
              badge={staffNote.trim() ? <CountBadge n={1} /> : null}
            >
              <div className="p-4">
                <Textarea
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  rows={3}
                  aria-labelledby="rdv-note"
                  placeholder="Ajouter une note sur ce rendez-vous"
                />
              </div>
            </Block>
          </aside>
        </div>

        <footer className="flex shrink-0 items-center gap-4 border-t border-base-300 px-8 py-5">
          <div className="min-w-0 flex-1">
            {canConfirm && chosenTime ? (
              <p>
                <span className="block text-[17px] font-semibold text-base-content first-letter:uppercase">
                  {shortDay(day)} · {chosenTime}
                </span>
                <span className="block text-sm text-base-content/60">
                  {salonConfig(salon).name} · {durationLabel(totalMin)}
                </span>
              </p>
            ) : (
              firstPending && blocker?.startsWith("Choisissez une réponse") ? (
                <button
                  type="button"
                  onClick={goToPending}
                  className="text-left text-sm font-medium text-warning-700 underline-offset-2 hover:underline"
                >
                  {blocker}
                </button>
              ) : (
                <p className="text-sm text-base-content/60">{blocker}</p>
              )
            )}
          </div>
          {lines.length > 0 && (
            <span className="mr-2 text-[20px] font-semibold tabular-nums text-base-content">{fcfa(totalPrice)}</span>
          )}
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!canConfirm} onClick={confirm}>
            {isCreate ? "Créer le rendez-vous" : "Confirmer la modification"}
          </Button>
        </footer>
      </Dialog>

      {isCreate && (
        <NewClientDialog
          open={newClient !== null}
          defaultSalon={salon}
          initialValues={newClient ?? undefined}
          existing={allClients}
          onClose={() => setNewClient(null)}
          onCreate={(draft) => {
            setClientId(createClient(draft));
            setNewClient(null);
          }}
        />
      )}
    </>
  );
}

/** Les prestations d'une catégorie rangées par sous-catégorie (Tissage, Brushing…), dans l'ordre
 *  où le catalogue les présente ; `name: null` pour celles qui n'en ont pas. */
function subGroups(items: Prestation[], nameOf: (p: Prestation) => string | null) {
  const out: { name: string | null; items: Prestation[] }[] = [];
  for (const p of items) {
    const name = nameOf(p);
    const group = out.find((g) => g.name === name);
    if (group) group.items.push(p);
    else out.push({ name, items: [p] });
  }
  return out;
}

/** Une question de prestation : réponses en tuiles photo (même esprit que le Bar
 *  Beauty, en plus petit), choix unique et obligatoire. Sans réponse, le cadre
 *  passe en ton d'alerte pour qu'on la retrouve d'un coup d'œil. */
function AnswerTiles({
  question,
  value,
  onChange,
}: {
  question: PrestationQuestion;
  value: string | null;
  onChange: (optionId: string) => void;
}) {
  const id = `pq-${question.id}`;
  return (
    <div
      className={cn(
        "rounded-field p-3 transition-colors",
        value ? "bg-base-200/60" : "bg-warning-25 ring-1 ring-warning-200",
      )}
    >
      <p id={id} className="mb-2.5 flex items-baseline gap-2 text-sm font-medium text-base-content">
        {question.label}
        {!value && <span className="text-xs font-medium whitespace-nowrap text-warning-700">À choisir</span>}
      </p>
      <div role="radiogroup" aria-labelledby={id} aria-required className="grid max-w-[440px] grid-cols-3 gap-2.5">
        {question.options.map((o) => {
          const selected = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.id)}
              className={cn(
                "group relative flex flex-col justify-start rounded-field border-2 bg-base-100 p-1.5 text-left transition",
                selected ? "border-primary" : "border-transparent ring-1 ring-base-300 hover:ring-base-content/30",
              )}
            >
              {o.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- photo de réponse (public/ ou dataURL)
                <img src={o.photo} alt="" className="aspect-[4/5] w-full rounded-[6px] object-cover" />
              ) : (
                <span className="flex aspect-[4/5] w-full items-center justify-center rounded-[6px] bg-base-200 px-2 text-center text-sm font-medium text-base-content/70">
                  {o.label}
                </span>
              )}
              {o.photo && (
                <span className="mt-1.5 line-clamp-2 block px-0.5 text-[13px] leading-tight font-medium text-base-content">
                  {o.label}
                </span>
              )}
              {selected && (
                // Coche bien visible (même pastille que le site de réservation).
                <span className="absolute top-2.5 right-2.5 flex size-10 items-center justify-center rounded-full bg-primary shadow-md ring-2 ring-white">
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" className="size-6">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocs de la colonne de droite                                       */
/* ------------------------------------------------------------------ */

const CountBadge = ({ n }: { n: number }) => (
  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-brand-700">{n}</span>
);

/** Un bloc de la colonne de droite : cadre, en-tête cliquable (titre + repère), contenu repliable. */
function Block({
  id,
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-box border border-base-300 bg-base-100">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-full items-center gap-2.5 px-4 text-left transition hover:bg-base-200/60"
      >
        <span id={id} className="text-[17px] font-semibold text-base-content">
          {title}
        </span>
        {badge}
        <ChevronDown aria-hidden className={cn("ml-auto size-5 text-secondary transition", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-base-300">{children}</div>}
    </section>
  );
}

type ExtraRow = { id: string; name: string; price: number; image?: string; detail?: string };

/** Extensions et Bar Beauty : un même bloc encadré, repliable, à quantités. */
function ExtraBlock({
  id,
  title,
  defaultOpen = false,
  rows,
  qty,
  onQty,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  rows: ExtraRow[];
  qty: (id: string) => number;
  onQty: (id: string, q: number) => void;
}) {
  const count = rows.reduce((n, r) => n + qty(r.id), 0);
  return (
    <Block id={id} title={title} defaultOpen={defaultOpen} badge={count > 0 ? <CountBadge n={count} /> : null}>
      <ul className="divide-y divide-base-300">
        {rows.map((r) => {
          const n = qty(r.id);
          return (
            <li key={r.id} className={cn("flex items-center gap-3 px-3 py-2.5", n > 0 && "bg-accent/60")}>
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="size-11 shrink-0 rounded-field object-cover" />
              ) : (
                <span aria-hidden className="size-11 shrink-0 rounded-field bg-base-200" />
              )}
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] leading-snug font-medium text-base-content">{r.name}</span>
                <span className="block truncate text-sm text-base-content/60">
                  <span className="tabular-nums">{fcfa(r.price)}</span>
                  {r.detail && ` · ${r.detail}`}
                </span>
              </span>
              {n === 0 ? (
                <StepButton icon={Plus} label={`Ajouter ${r.name}`} onClick={() => onQty(r.id, 1)} />
              ) : (
                <span className="flex shrink-0 items-center gap-2">
                  <StepButton icon={Minus} label={`Retirer un ${r.name}`} onClick={() => onQty(r.id, n - 1)} />
                  <span className="w-5 text-center text-[15px] font-semibold tabular-nums text-base-content">{n}</span>
                  <StepButton icon={Plus} label={`Ajouter un ${r.name}`} onClick={() => onQty(r.id, n + 1)} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Block>
  );
}

function StepButton({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-secondary/40 text-secondary transition hover:border-secondary hover:bg-accent active:scale-[0.94]"
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Choix de la cliente (création)                                      */
/* ------------------------------------------------------------------ */

const PHONE_LIKE = /^[+\d\s().-]+$/;

function prefillFrom(query: string): NewClientPrefill {
  const q = query.trim();
  if (q && /\d/.test(q) && PHONE_LIKE.test(q)) return { phone: q };
  const [firstName, ...rest] = q.split(/\s+/);
  return { firstName: firstName ?? "", lastName: rest.join(" ") };
}

function ClientPicker({
  clients,
  value,
  onChange,
  onCreateNew,
}: {
  clients: ClientRow[];
  value: ClientRow | null;
  onChange: (id: string | null) => void;
  onCreateNew: (prefill: NewClientPrefill) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const results = q ? clients.filter((c) => clientMatchesQuery(c, q)).slice(0, 6) : [];

  return (
    <section aria-labelledby="rdv-client">
      <h3 id="rdv-client" className="mb-3 text-[17px] font-semibold text-base-content">
        Cliente
      </h3>
      {value ? (
        <div className="flex items-center gap-4 rounded-box border border-primary bg-accent px-4 py-3 ring-1 ring-primary">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-100 text-secondary">
            <UserRound aria-hidden className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-base-content">{value.name}</span>
            <span className="block truncate text-sm text-base-content/60">
              {clientNumberLabel(value.number)} · {value.phone}
            </span>
          </span>
          <Button variant="outline" size="sm" onClick={() => onChange(null)}>
            Changer
          </Button>
        </div>
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, téléphone ou n° client"
            aria-label="Rechercher une cliente"
            autoFocus
          />
          {q && (
            <ul className="mt-2 overflow-hidden rounded-field border border-base-300">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onChange(c.id)}
                    className="flex min-h-12 w-full items-center gap-3 border-b border-base-300 px-4 py-2 text-left hover:bg-base-200/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-base-content">{c.name}</span>
                      <span className="block truncate text-sm text-base-content/60">
                        {clientNumberLabel(c.number)} · {c.phone}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => onCreateNew(prefillFrom(q))}
                  className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-[15px] font-medium text-secondary hover:bg-base-200/60"
                >
                  <Plus aria-hidden className="size-4" />
                  {results.length === 0 ? `Aucune cliente trouvée — créer la fiche « ${q} »` : `Créer une fiche « ${q} »`}
                </button>
              </li>
            </ul>
          )}
        </>
      )}
    </section>
  );
}
