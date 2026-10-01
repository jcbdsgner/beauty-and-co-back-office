"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  AttendeesDialog,
  type Attendees,
} from "@/components/prise-rdv/attendees-dialog";
import { BookingConfirmedDialog } from "@/components/prise-rdv/booking-confirmed-dialog";
import { BookingProgress } from "@/components/prise-rdv/booking-progress";
import { BookingSummarySidebar } from "@/components/prise-rdv/booking-summary-sidebar";
import { LeaveBookingDialog } from "@/components/prise-rdv/leave-booking-dialog";
import {
  AlreadyPaidDialog,
  redeemableItemKey,
  type RedeemableEntry,
} from "@/components/prise-rdv/already-paid-dialog";
import { PackUpsellDialog } from "@/components/prise-rdv/pack-upsell-dialog";
import {
  PaymentMethodDialog,
  type PaymentMethod,
} from "@/components/prise-rdv/payment-method-dialog";
import {
  ClientesStep,
  type PersonAssignment,
} from "@/components/prise-rdv/steps/clientes-step";
import { ServicesStep } from "@/components/prise-rdv/steps/services-step";
import {
  CreneauStep,
  type StaffRow,
} from "@/components/prise-rdv/steps/creneau-step";
import {
  ConfirmationStep,
  type ConfirmationExtras,
} from "@/components/prise-rdv/steps/confirmation-step";
import { bcoFontVariables } from "@/components/prise-rdv/fonts";
import { useClientsData } from "@/context/ClientsContext";
import {
  buildCartItems,
  requiresAlmadiesOnly,
  type PrestationCoverage,
  type Selections,
} from "@/lib/prise-rdv/cart";
import { buildPersonTabs } from "@/lib/prise-rdv/people";
import {
  addMinutes,
  DEPOSIT_AMOUNT,
  formatPrice,
} from "@/lib/prise-rdv/format";
import { answerKey, type QuestionAnswers } from "@/lib/prise-rdv/questions";
import { bookingLocations } from "@/lib/prise-rdv/data/booking-locations";
import { bookingServices } from "@/lib/prise-rdv/data/booking-services";
import { type Pack } from "@/lib/prise-rdv/data/packs";
import {
  emptyContactInfo,
  type BookingStepId,
  type ContactInfo,
  type PersonTab,
} from "@/lib/prise-rdv/types";
import {
  DEMO_TODAY_ISO,
  LOCATION_ID_BY_SALON,
  SALON_ID_BY_LOCATION,
  alternativesFor,
  availableTimes,
  planAt,
  type PlanContext,
  type PlanItem,
} from "@/lib/prise-rdv/planifier";
import { cn, toSentenceCase } from "@/lib/prise-rdv/utils";
import {
  clientFullName,
  toCliente,
  type Cliente,
  type Ethnicity,
} from "@/lib/prise-rdv/clientes";
import {
  abonnementSeeds,
  availablePrestationIds,
  forfaitById,
  packById,
  packPurchaseSeeds,
  packRemainingIds,
} from "@/lib/mock/abonnements";
import { isClosed, salons, today, type SalonId } from "@/lib/mock/beautyandco";
import type { PlanningData } from "@/lib/mock/planning";
import {
  newRdvId,
  posteTypeForCategory,
  type RdvAdvantage,
  type RdvDetail,
  type RdvExtra,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";
import { conflictWith, prestationSeeds, serviceSeeds } from "@/lib/mock/services";
import { useServicesData } from "@/components/back-office/services/ServicesData";
import "@/components/prise-rdv/prise-rdv.css";

/**
 * « Nouveau rendez-vous » : le parcours de prise de rendez-vous de point-de-vente
 * (`components/prise-rdv/prise-rdv-modal.tsx`, lui-même le site b&co recopié à l'identique),
 * repris tel quel — mêmes étapes, mêmes écrans, même apparence. Écarts, tous côté données :
 * clientèle lue dans `ClientsContext`, horaires et praticiennes calculés sur l'agenda et le
 * planning du back-office (`lib/prise-rdv/planifier.ts`), abonnements et packs lus dans
 * `@/lib/mock/abonnements`, le rendez-vous rendu en `RdvDetail` via `onCreate`. Pas
 * d'« Encaisser maintenant » (pas de caisse ici) ni de mode « Modifier » (voir `EditRdvDialog`).
 */

/** Largeur de référence du site : tout le contenu est rendu à cette largeur puis réduit proportionnellement pour tenir. */
const DESIGN_WIDTH = 1440;

type DepositMode = "especes" | "mobile_money" | "carte";
const DEPOSIT_MODE: Record<PaymentMethod, DepositMode> = {
  cash: "especes",
  "mobile-money": "mobile_money",
  card: "carte",
};
const DEPOSIT_MODE_LABEL: Record<DepositMode, string> = {
  especes: "en espèces",
  mobile_money: "par mobile money",
  carte: "par carte",
};

/** Boutique du site ↔ Produits du catalogue (seul Becky Wave existe des deux côtés). */
const PRODUIT_ID_BY_BOUTIQUE: Record<string, string> = {
  "becky-wave": "becky-wave-raw-hair",
};

const subServiceById = new Map(
  bookingServices.flatMap((category) =>
    category.subServices.map((sub) => [sub.id, { sub, category }] as const),
  ),
);

/** Nom du service parent dans le catalogue du back-office (« Coiffure »…) — la `category` d'un RDV. */
const categoryNameOf = (prestationId: string) => {
  const serviceId = prestationSeeds.find((p) => p.id === prestationId)?.serviceId;
  return serviceSeeds.find((s) => s.id === serviceId)?.name ?? "Autres prestations";
};
const prestationNameOf = (prestationId: string, fallback: string) =>
  prestationSeeds.find((p) => p.id === prestationId)?.name ?? fallback;

const dateISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

let refSeq = 5000;

type PriseRdvModalProps = {
  open: boolean;
  /** Salon pré-choisi à l'étape Créneau (le salon filtré), modifiable. `null` ⇒ aucun (« Tous les salons »). */
  defaultSalonId?: SalonId | null;
  /** Rendez-vous de la session — occupation des praticiennes. */
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  /** Payeuse pré-remplie (ouverture depuis une fiche cliente, `?client=`). */
  initialClientId?: string;
  onCreate: (rdv: RdvDetail) => void;
  onClose: () => void;
};

export function PriseRdvModal({
  open,
  defaultSalonId = null,
  rdvs,
  planningData,
  initialClientId,
  onCreate,
  onClose,
}: PriseRdvModalProps) {
  if (!open) return null;
  return (
    <ScaledFrame>
      {(scroller) => (
        <PriseRdvFlow
          defaultSalonId={defaultSalonId ?? null}
          rdvs={rdvs}
          planningData={planningData}
          initialClientId={initialClientId}
          scroller={scroller}
          onCreate={onCreate}
          onClose={onClose}
        />
      )}
    </ScaledFrame>
  );
}

/**
 * Très grand, pas plein écran. Le contenu est rendu à la largeur du site puis mis à l'échelle ; le
 * `transform` fait aussi de ce cadre le bloc conteneur des fenêtres `fixed` du site (nombre de
 * personnes, acompte…), qui s'ouvrent donc par-dessus le parcours et non par-dessus toute l'app.
 */
function ScaledFrame({
  children,
}: {
  children: (
    scroller: React.RefObject<HTMLDivElement | null>,
  ) => React.ReactNode;
}) {
  // Callback ref : le Portal Radix ne monte le panneau qu'après le premier rendu.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!panel) return;
    const measure = () =>
      setSize({ width: panel.clientWidth, height: panel.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [panel]);

  const scale = size ? Math.min(1, size.width / DESIGN_WIDTH) : 1;

  // Radix, comme les autres dialogues de l'app : il s'empile proprement par-dessus la fiche
  // réservation (elle-même un Dialog Radix), qui sinon rendrait ce parcours inerte. Ni Échap ni un
  // clic à côté ne ferment le parcours — seule la croix, confirmée, le quitte (comme sur le site).
  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="fixed inset-0 z-[70] flex items-center justify-center p-6 outline-none"
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Prendre rendez-vous</DialogPrimitive.Title>
          </VisuallyHidden>
          <div
            ref={setPanel}
            className={cn(
              "bco relative h-[92vh] w-[min(94vw,1600px)] overflow-hidden rounded-3xl bg-[#EBDDDA] shadow-2xl",
              bcoFontVariables,
            )}
          >
            <div
              style={{
                width: size ? size.width / scale : "100%",
                height: size ? size.height / scale : "100%",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                visibility: size ? "visible" : "hidden",
              }}
            >
              <div
                ref={scrollerRef}
                className="h-full overflow-y-auto p-[31px]"
              >
                {children(scrollerRef)}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PriseRdvFlow({
  defaultSalonId,
  rdvs,
  planningData,
  initialClientId,
  scroller,
  onCreate,
  onClose,
}: {
  defaultSalonId: SalonId | null;
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  initialClientId?: string;
  scroller: React.RefObject<HTMLDivElement | null>;
  onCreate: (rdv: RdvDetail) => void;
  onClose: () => void;
}) {
  const { rows, createClient: createClientRow } = useClientsData();
  const clientRows = useMemo(() => rows("all"), [rows]);
  const clients = useMemo(() => clientRows.map(toCliente), [clientRows]);
  // Le RDV construit, remis à l'écran à la fermeture de « Rendez-vous confirmé ! ».
  const [created, setCreated] = useState<RdvDetail | null>(null);

  const [attendees, setAttendees] = useState<Attendees | null>(null);
  const [step, setStep] = useState<BookingStepId>("clientes");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [assignments, setAssignments] = useState<
    Record<string, PersonAssignment>
  >(() => {
    const initial: Record<string, PersonAssignment> = {};
    if (initialClientId) initial["adulte-1"] = { clientId: initialClientId };
    return initial;
  });
  const [selections, setSelections] = useState<Selections>({});
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswers>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    defaultSalonId ? (LOCATION_ID_BY_SALON[defaultSalonId] ?? null) : null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [twoPractitioners, setTwoPractitioners] = useState(false);
  const [staffOverrides, setStaffOverrides] = useState<
    Record<string, string[]>
  >({});
  const [note, setNote] = useState("");
  const [pendingExtras, setPendingExtras] = useState<ConfirmationExtras | null>(
    null,
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Déjà payé / suggestion de pack — ouvert en sortant de l'étape Clientes, une fois la payeuse
  // connue (sur le site, c'est la connexion qui la fait connaître).
  const [gateOpen, setGateOpen] = useState(false);
  const [redeemableGateResolved, setRedeemableGateResolved] = useState(false);
  const [redeemablesApplied, setRedeemablesApplied] = useState(false);
  const [redeemableItemSelections, setRedeemableItemSelections] = useState<
    Record<string, boolean>
  >({});
  const [redeemableItemAssignments, setRedeemableItemAssignments] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [step, scroller]);

  const basePeople = buildPersonTabs(attendees);
  const baseAdults = basePeople.filter((person) => person.type === "adult");
  // Une réservation d'enfant(s) seul(s) : la payeuse ne reçoit rien, mais il faut quand même la trouver.
  const payerSlot: PersonTab = baseAdults[0] ?? {
    id: "payeuse",
    label: "Payeuse",
    type: "adult",
  };
  const slots = baseAdults.length > 0 ? basePeople : [payerSlot, ...basePeople];
  const clientById = (id?: string) =>
    id ? clients.find((c) => c.id === id) : undefined;
  const labelFor = (person: PersonTab) => {
    const assignment = assignments[person.id];
    const client = clientById(assignment?.clientId);
    return client
      ? clientFullName(client)
      : assignment?.name?.trim() || person.label;
  };
  // Les onglets du site portent les noms retrouvés à l'étape Clientes plutôt que « Adulte 2 ».
  const people = basePeople.map((person) => ({
    ...person,
    label: labelFor(person),
  }));
  const adults = people.filter((person) => person.type === "adult");
  const payer = clientById(assignments[payerSlot.id]?.clientId);

  const redeemableEntries: RedeemableEntry[] = useMemo(() => {
    if (!payer) return [];
    const toPrestation = (id: string) => {
      const found = subServiceById.get(id);
      return found
        ? {
            id,
            label: toSentenceCase(found.sub.label),
            categoryId: found.category.id,
            duration: found.sub.duration,
          }
        : null;
    };
    const abonnementAvailablePrestations = (ab: (typeof abonnementSeeds)[number]) =>
      availablePrestationIds(
        forfaitById(ab.forfaitId)?.prestationIds ?? [],
        ab.redeemedPrestationIds,
      );
    const packRemainingPrestations = (pp: (typeof packPurchaseSeeds)[number]) => {
      const pack = packById(pp.packId);
      return pack ? packRemainingIds(pp, pack) : [];
    };
    const abonnementEntries = abonnementSeeds
      .filter((ab) => ab.clientId === payer.id && ab.revokedAt == null)
      .filter((ab) => abonnementAvailablePrestations(ab).length > 0)
      .sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt))
      .slice(0, 1)
      .map((ab): RedeemableEntry => ({
        entryId: ab.id,
        source: "abonnement",
        sourceLabel: forfaitById(ab.forfaitId)?.label ?? "Abonnement",
        remainingPrestations: abonnementAvailablePrestations(ab)
          .map(toPrestation)
          .filter((p) => p !== null),
      }));
    const packEntries = packPurchaseSeeds
      .filter((pp) => pp.clientId === payer.id)
      .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
      .slice(0, 2)
      .map((pp): RedeemableEntry => ({
        entryId: pp.id,
        source: "pack",
        sourceLabel: packById(pp.packId)?.label ?? "Pack",
        remainingPrestations: packRemainingPrestations(pp)
          .map(toPrestation)
          .filter((p) => p !== null),
      }))
      .filter((entry) => entry.remainingPrestations.length > 0);
    return [...abonnementEntries, ...packEntries];
  }, [payer]);
  const hasRedeemableEntries = redeemableEntries.length > 0;

  const isRedeemableItemSelected = (entryId: string, prestationId: string) =>
    redeemableItemSelections[redeemableItemKey(entryId, prestationId)] ?? false;
  const getRedeemableItemPersonId = (
    entryId: string,
    prestationId: string,
  ): string | null =>
    redeemableItemAssignments[redeemableItemKey(entryId, prestationId)] ??
    adults[0]?.id ??
    null;
  const coverage: PrestationCoverage = new Map();
  if (redeemablesApplied) {
    for (const entry of redeemableEntries) {
      for (const prestation of entry.remainingPrestations) {
        if (!isRedeemableItemSelected(entry.entryId, prestation.id)) continue;
        const personId = getRedeemableItemPersonId(
          entry.entryId,
          prestation.id,
        );
        if (!personId) continue;
        const bySub =
          coverage.get(personId) ?? new Map<string, "pack" | "abonnement">();
        bySub.set(prestation.id, entry.source);
        coverage.set(personId, bySub);
      }
    }
  }
  const cartItems = buildCartItems(people, selections, coverage);
  const almadiesOnly = requiresAlmadiesOnly(cartItems);
  const availableLocations = almadiesOnly
    ? bookingLocations.filter((location) => location.id === "almadies")
    : bookingLocations;

  // Une prestation réservée aux Almadies invalide un Sea Plaza déjà choisi : il faut rechoisir.
  const locationId =
    almadiesOnly && selectedLocationId !== "almadies" ? null : selectedLocationId;
  // Almadies ferme le lundi : le lieu reste visible, mais n'est pas choisissable ce jour-là.
  const closedLocationIds = selectedDate
    ? bookingLocations
        .filter((location) => isClosed(SALON_ID_BY_LOCATION[location.id], dateISO(selectedDate)))
        .map((location) => location.id)
    : [];

  const totalMinutes = people.reduce((max, person) => {
    const personMinutes = cartItems
      .filter((item) => item.personId === person.id)
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    return Math.max(max, personMinutes);
  }, 0);
  const twoPractitionersMinutes = people.reduce((max, person) => {
    const personItems = cartItems.filter((item) => item.personId === person.id);
    const eligibleMinutes = personItems
      .filter((item) => item.twoPractitionersEligible)
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    const soloOnlyMinutes = personItems
      .filter((item) => !item.twoPractitionersEligible)
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    return Math.max(max, Math.round(eligibleMinutes / 2) + soloOnlyMinutes);
  }, 0);
  const effectiveTotalMinutes = twoPractitioners
    ? twoPractitionersMinutes
    : totalMinutes;
  const locationLabel =
    bookingLocations.find((location) => location.id === locationId)
      ?.label ?? null;

  // L'agenda réel : quels horaires tiennent, et qui pose chaque prestation.
  // Jours / horaires et périodes d'indisponibilité de chaque prestation, tels que réglés dans Services (état de session).
  const { prestations: catalog } = useServicesData();
  const availabilityOf = (id: string) => catalog.find((p) => p.id === id);
  const planItems: PlanItem[] = cartItems.map((item) => ({
    key: item.id,
    personId: item.personId,
    serviceId: item.subServiceId,
    categoryId: item.categoryId,
    durationMinutes: item.durationMinutes,
    twoPractitionersEligible: item.twoPractitionersEligible,
  }));
  const planContext: PlanContext | null =
    selectedDate && locationId
      ? {
          date: dateISO(selectedDate),
          salonId: SALON_ID_BY_LOCATION[locationId],
          rdvs,
          planningData,
          availabilityOf,
        }
      : null;
  const timeSlots = planContext
    ? availableTimes(planContext, planItems, twoPractitioners)
    : [];
  // En modification, l'horaire d'origine peut ne pas tomber sur une demi-heure : on le garde proposé.
  if (
    planContext &&
    selectedTime &&
    !timeSlots.includes(selectedTime) &&
    planAt(planContext, planItems, selectedTime, twoPractitioners)
  ) {
    timeSlots.push(selectedTime);
    timeSlots.sort();
  }
  const effectiveTime =
    selectedTime && timeSlots.includes(selectedTime) ? selectedTime : null;
  const plan =
    planContext && effectiveTime
      ? planAt(
          planContext,
          planItems,
          effectiveTime,
          twoPractitioners,
          staffOverrides,
        )
      : null;
  const staffRows: StaffRow[] =
    plan && planContext
      ? plan.map((line) => {
          const item = cartItems.find((c) => c.id === line.key)!;
          return {
            key: line.key,
            label: item.label,
            personLabel: people.length > 1 ? item.personLabel : undefined,
            start: line.start,
            end: addMinutes(line.start, line.durationMin),
            staffIds: line.staffIds,
            options: alternativesFor(planContext, plan, line).map((p) => ({ id: p.id, name: p.name })),
          };
        })
      : [];

  // Incompatibilités « même visite » réglées dans Services : une prestation
  // incompatible avec ce que la personne a déjà choisi ne s'ajoute pas.
  const conflictFor = (personId: string, subServiceId: string) =>
    conflictWith(catalog, subServiceId, selections[personId] ?? []);

  const toggleSubService = (personId: string, subServiceId: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      const current = new Set(next[personId] ?? []);
      if (current.has(subServiceId)) current.delete(subServiceId);
      else if (conflictWith(catalog, subServiceId, current)) return prev;
      else current.add(subServiceId);
      next[personId] = current;
      return next;
    });
  };

  const choosePackToBuy = (pack: Pack) => {
    const personId = adults[0]?.id;
    if (personId) {
      setSelections((prev) => {
        const next = { ...prev };
        const current = new Set(next[personId] ?? []);
        for (const prestationId of pack.prestationIds)
          current.add(prestationId);
        next[personId] = current;
        return next;
      });
    }
    resolveGate();
  };

  const resolveGate = () => {
    setRedeemableGateResolved(true);
    setGateOpen(false);
  };

  const applyRedeemableEntriesToBooking = () => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const entry of redeemableEntries) {
        for (const prestation of entry.remainingPrestations) {
          if (!isRedeemableItemSelected(entry.entryId, prestation.id)) continue;
          const personId = getRedeemableItemPersonId(
            entry.entryId,
            prestation.id,
          );
          if (!personId) continue;
          const current = new Set(next[personId] ?? []);
          current.add(prestation.id);
          next[personId] = current;
        }
      }
      return next;
    });
    setRedeemablesApplied(true);
    resolveGate();
  };

  const toggleRedeemableItem = (entryId: string, prestationId: string) => {
    const key = redeemableItemKey(entryId, prestationId);
    setRedeemableItemSelections((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? false),
    }));
  };

  const assignRedeemableItemPerson = (
    entryId: string,
    prestationId: string,
    personId: string,
  ) => {
    const key = redeemableItemKey(entryId, prestationId);
    setRedeemableItemAssignments((prev) => ({ ...prev, [key]: personId }));
    setRedeemableItemSelections((prev) => ({ ...prev, [key]: true }));
  };

  const answerQuestion = (
    personId: string,
    categoryId: string,
    questionId: string,
    value: string,
  ) => {
    setQuestionAnswers((prev) => {
      const key = answerKey(personId, categoryId);
      return { ...prev, [key]: { ...(prev[key] ?? {}), [questionId]: value } };
    });
  };

  const createClient = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    birthday: string;
    ethnicity: Ethnicity;
  }): Cliente => {
    const salon = planContext?.salonId ?? defaultSalonId ?? "almadies";
    const id = createClientRow({
      name: `${data.firstName} ${data.lastName}`.trim(),
      gender: "femme",
      salon,
      phone: data.phone,
      whatsapp: data.phone,
      email: data.email,
      address: "",
      profession: "",
      residenceCountry: "Sénégal",
      birthday: data.birthday,
      ethnicity: data.ethnicity,
    });
    return {
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      loyaltyCode: "",
    };
  };

  const leaveClientes = () => {
    setStep("services");
    if (!redeemableGateResolved) setGateOpen(true);
  };

  // La confirmation montre « Prénom et nom / Email » de chaque adulte : on les lit sur leurs fiches.
  const contacts = slots.filter((slot) => slot.type === "adult");
  const contactInfoByPerson: Record<string, ContactInfo> = Object.fromEntries(
    slots.map((slot) => {
      const assignment = assignments[slot.id];
      const client = clientById(assignment?.clientId);
      return [
        slot.id,
        client
          ? {
              ...emptyContactInfo,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email ?? "",
              phone: client.phone,
            }
          : { ...emptyContactInfo, firstName: assignment?.name ?? "" },
      ];
    }),
  );

  const toExtras = (extras: ConfirmationExtras): RdvExtra[] => [
    ...extras.drinkIds.map((id, i): RdvExtra => ({
      id: `ex${i + 1}`,
      kind: "boisson",
      productId: `boisson-${id}`,
      qty: 1,
    })),
    ...extras.products
      .filter((p) => PRODUIT_ID_BY_BOUTIQUE[p.id])
      .map((p, i): RdvExtra => ({
        id: `ex${extras.drinkIds.length + i + 1}`,
        kind: "produit",
        productId: PRODUIT_ID_BY_BOUTIQUE[p.id],
        qty: p.qty,
      })),
  ];

  /** Construit le `RdvDetail` de la réservation (pendant du `saveParcoursReservation` de la caisse). */
  const save = (
    extras: ConfirmationExtras,
    deposit?: { amount: number; mode: DepositMode },
  ): RdvDetail | null => {
    const payerRow = clientRows.find((c) => c.id === payer?.id);
    if (!plan || !planContext || !selectedDate || !payer || !payerRow) {
      setSaveError("Choisissez un créneau disponible avant de confirmer.");
      return null;
    }
    const nameOf = (personId: string) => {
      const person = slots.find((slot) => slot.id === personId);
      const assignment = assignments[personId];
      const client = clientById(assignment?.clientId);
      return client
        ? clientFullName(client)
        : assignment?.name?.trim() || person?.label || "Invitée";
    };
    const prestations: RdvPrestation[] = plan.map((line, i) => {
      const item = cartItems.find((c) => c.id === line.key);
      const category = categoryNameOf(line.serviceId);
      const isPayer = line.personId === payerSlot.id;
      return {
        id: `p${i + 1}`,
        prestationId: line.serviceId,
        category,
        name: prestationNameOf(line.serviceId, item?.label ?? line.serviceId),
        durationMin: line.durationMin,
        price: item?.price ?? 0,
        posteType: posteTypeForCategory(category),
        staff: line.staffIds[0] ?? null,
        secondStaff: line.staffIds[1] ?? null,
        start: line.start,
        beneficiaryName: isPayer ? payerRow.name : nameOf(line.personId),
        beneficiaryClientId: isPayer ? null : (assignments[line.personId]?.clientId ?? null),
      };
    });
    const startTime = [...plan].map((l) => l.start).sort()[0];
    const advantages: RdvAdvantage[] = [];
    for (const entry of redeemableEntries) {
      if (!redeemablesApplied) break;
      if (!entry.remainingPrestations.some((p) => isRedeemableItemSelected(entry.entryId, p.id))) continue;
      advantages.push(
        entry.source === "abonnement"
          ? { kind: "abonnement", abonnementId: entry.entryId }
          : { kind: "pack", packPurchaseId: entry.entryId },
      );
    }
    const questions = Object.entries(questionAnswers).flatMap(([key, answers]) => {
      const [personId, categoryId] = key.split(":");
      const category = bookingServices.find((c) => c.id === categoryId);
      const who = people.length > 1 ? ` — ${nameOf(personId)}` : "";
      return (category?.requiredQuestions ?? []).map((q, i) => ({
        id: `q-${key}-${i}`,
        question: `${q.label}${who}`,
        answer: answers[q.id]?.trim() || null,
      }));
    });
    const salonEntry = salons.find((s) => s.id === planContext.salonId)!;
    const createdAt = `${DEMO_TODAY_ISO}T${today.currentTime}:00`;
    const details = [
      "Saisi au salon",
      deposit ? `acompte de ${formatPrice(deposit.amount)} réglé ${DEPOSIT_MODE_LABEL[deposit.mode]}` : null,
      note.trim() ? `note : « ${note.trim()} »` : null,
    ].filter(Boolean);
    setSaveError(null);
    return {
      id: newRdvId(),
      ref: `#bo-${refSeq++}`,
      status: "à venir",
      date: `${dateISO(selectedDate)}T${startTime}:00`,
      salon: planContext.salonId,
      salonLabel: salonEntry.name,
      client: {
        id: payerRow.id,
        name: payerRow.name,
        email: payerRow.email,
        phone: payerRow.phone,
        whatsapp: payerRow.whatsapp,
        loyaltyPoints: payerRow.loyaltyPoints,
      },
      staffGlobal:
        new Set(prestations.map((p) => p.staff)).size === 1 ? prestations[0].staff : null,
      prestations,
      extras: toExtras(extras),
      questions,
      advantages,
      events: [{ at: createdAt, label: "Rendez-vous créé", detail: details.join(" · ") }],
    };
  };

  const payerName = payer ? clientFullName(payer) : "la cliente";

  const handleConfirm = (grandTotal: number, extras: ConfirmationExtras) => {
    if (grandTotal <= 0) {
      const rdv = save(extras);
      if (rdv) {
        setCreated(rdv);
        setConfirmation({
          title: "Rendez-vous confirmé !",
          message: `La réservation de ${payerName} est enregistrée.`,
        });
      }
      return;
    }
    setPendingExtras(extras);
    setShowPaymentDialog(true);
  };

  const handleDeposit = (method: PaymentMethod) => {
    setShowPaymentDialog(false);
    const mode = DEPOSIT_MODE[method];
    const rdv = save(pendingExtras ?? { drinkIds: [], products: [] }, {
      amount: DEPOSIT_AMOUNT,
      mode,
    });
    if (rdv) {
      setCreated(rdv);
      setConfirmation({
        title: "Rendez-vous confirmé !",
        message: `La réservation de ${payerName} est enregistrée. Acompte de ${formatPrice(DEPOSIT_AMOUNT)} réglé ${DEPOSIT_MODE_LABEL[mode]}.`,
      });
    }
  };

  const stepNumber = {
    clientes: 1,
    services: 2,
    creneau: 3,
    confirmation: 4,
  } as const;

  return (
    <div className="rounded-none border border-[rgba(234,236,240,0.6)] bg-[var(--color-bg-subtle)] p-6 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)] sm:rounded-3xl sm:p-10">
      <div className="relative">
        <h1 className="px-12 text-center text-[19px] font-bold text-[var(--color-gray-800)] sm:px-14 sm:text-[27px]">
          Prendre rendez-vous
        </h1>
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          aria-label="Quitter la prise de rendez-vous"
          className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--color-gray-50)] text-[var(--color-gray-500)] transition hover:bg-[var(--color-gray-100)] hover:text-[var(--text-secondary)]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-8">
        <BookingProgress currentStep={step} />
      </div>

      {saveError && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-[#fef3f2] px-4 py-3 text-[17px] text-[var(--color-error)]"
        >
          {saveError}
        </p>
      )}

      <div
        className={cn(
          "mt-10 grid gap-10",
          step !== "confirmation" && "lg:grid-cols-[1fr_320px]",
        )}
      >
        <div className="min-w-0">
          {step === "clientes" && (
            <ClientesStep
              slots={slots}
              payerSlotId={payerSlot.id}
              assignments={assignments}
              clients={clients}
              onAssign={(slotId, assignment) =>
                setAssignments((prev) => ({ ...prev, [slotId]: assignment }))
              }
              onCreateClient={createClient}
              canContinue={Boolean(payer)}
              onContinue={leaveClientes}
              onBack={() => setAttendees(null)}
            />
          )}

          {step === "services" && (
            <ServicesStep
              people={people}
              selections={selections}
              onToggleSubService={toggleSubService}
              conflictFor={conflictFor}
              questionAnswers={questionAnswers}
              onAnswerQuestion={answerQuestion}
              onContinue={() => setStep("creneau")}
              onCancel={() => setStep("clientes")}
              coverage={coverage}
            />
          )}

          {step === "creneau" && (
            <CreneauStep
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              locations={availableLocations}
              closedLocationIds={closedLocationIds}
              selectedLocationId={locationId}
              onSelectLocation={(id) => {
                setSelectedLocationId(id);
                setSelectedTime(null);
              }}
              selectedTime={effectiveTime}
              onSelectTime={setSelectedTime}
              timeSlots={timeSlots}
              staffRows={staffRows}
              onChangeStaff={(key, index, staffId) => {
                const current =
                  staffRows.find((row) => row.key === key)?.staffIds ?? [];
                const next = [...current];
                next[index] = staffId;
                setStaffOverrides((prev) => ({ ...prev, [key]: next }));
              }}
              totalMinutes={totalMinutes}
              twoPractitionersMinutes={twoPractitionersMinutes}
              twoPractitioners={twoPractitioners}
              onToggleTwoPractitioners={setTwoPractitioners}
              canContinue={Boolean(selectedDate && locationId && plan)}
              onContinue={() => setStep("confirmation")}
              onBack={() => setStep("services")}
            />
          )}

          {step === "confirmation" && (
            <ConfirmationStep
              cartItems={cartItems}
              note={note}
              onNoteChange={setNote}
              locationLabel={locationLabel}
              date={selectedDate}
              time={effectiveTime}
              totalMinutes={effectiveTotalMinutes}
              adults={contacts.filter(
                (c) => assignments[c.id]?.clientId || assignments[c.id]?.name,
              )}
              contactInfoByPerson={contactInfoByPerson}
              onBack={() => setStep("creneau")}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        {step !== "confirmation" && (
          <BookingSummarySidebar
            step={stepNumber[step]}
            cartItems={cartItems}
            showPersonLabels={people.length > 1}
            date={step === "creneau" ? selectedDate : null}
            time={step === "creneau" ? effectiveTime : null}
            locationLabel={step === "creneau" ? locationLabel : null}
            totalMinutesOverride={
              step === "creneau" ? effectiveTotalMinutes : undefined
            }
          />
        )}
      </div>

      <AttendeesDialog
        open={attendees === null}
        initial={attendees ?? undefined}
        onConfirm={setAttendees}
        onCancel={onClose}
      />
      {hasRedeemableEntries ? (
        <AlreadyPaidDialog
          open={gateOpen && adults.length > 0}
          entries={redeemableEntries}
          adults={adults}
          selectedItems={redeemableItemSelections}
          itemAssignments={redeemableItemAssignments}
          onToggleItem={toggleRedeemableItem}
          onAssignItem={assignRedeemableItemPerson}
          onViewOtherServices={applyRedeemableEntriesToBooking}
          onSkipToCreneau={() => {
            applyRedeemableEntriesToBooking();
            setStep("creneau");
          }}
        />
      ) : (
        <PackUpsellDialog
          open={gateOpen}
          onChoosePack={choosePackToBuy}
          onSkip={resolveGate}
        />
      )}
      <LeaveBookingDialog
        open={showLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={onClose}
      />
      <PaymentMethodDialog
        open={showPaymentDialog}
        amountLabel={formatPrice(DEPOSIT_AMOUNT)}
        description={`Réglez l'acompte (${formatPrice(DEPOSIT_AMOUNT)}) pour confirmer le rendez-vous.`}
        onClose={() => setShowPaymentDialog(false)}
        onSelect={handleDeposit}
      />
      <BookingConfirmedDialog
        open={confirmation !== null}
        title={confirmation?.title ?? ""}
        message={confirmation?.message ?? ""}
        onClose={() => (created ? onCreate(created) : onClose())}
      />
    </div>
  );
}
