"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  CalendarClock,
  Coffee,
  Feather,
  Flower2,
  Gift,
  Hand,
  Mail,
  MessageCircle,
  PackageCheck,
  Pencil,
  Phone,
  RotateCcw,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { Field } from "@/components/ui/molecules/field";
import { Alert } from "@/components/ui/molecules/alert";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Textarea } from "@/components/ui/atoms/textarea";
import { cn } from "@/lib/utils";
import { fullName, members } from "@/lib/mock/staff";
import { accentForMemberId } from "@/lib/mock/staff-colors";
import { presentPractitioners, type PlanningData } from "@/lib/mock/planning";
import { preferenceLines } from "@/lib/mock/preference-targets";
import { TIER_LABEL, salonName, type ClientDetail } from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import { usePreferenceConfig } from "@/context/PreferencesContext";
import { prestationSeeds, productKind, productName } from "@/lib/mock/services";
import { ABONNEMENT_STATUS_META, forfaitById, packById } from "@/lib/mock/abonnements";
import {
  allRendezvous,
  availablePractitioners,
  beneficiaryKey,
  beneficiaryKindOf,
  durationLabel,
  extraPrice,
  fcfa,
  frLongDate,
  minutesToTime,
  rdvDuration,
  rdvEndTime,
  rdvStartTime,
  reservationComposition,
  timeToMinutes,
  type BeneficiaryKind,
  type RdvDetail,
  type RdvPrestation,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import RdvDialog, { type Reschedule } from "./rendezvous/RdvDialog";
import { initialsOf } from "./shared/PersonCard";
import { Legend } from "./shared/board";
import {
  AvantageChip,
  clientAbonnements,
  clientGiftCard,
  clientPacks,
  packRemaining,
  rdvCoverage,
  statusOf,
} from "./shared/ClientAdvantages";

// Fiche rendez-vous — une page (refonte 2026-09-28, skill `impeccable`, sur une
// référence fournie par la propriétaire ; remplace le panneau latéral repris de
// point-de-vente). Les 3 questions :
// 1. Elle arrive depuis la liste, l'agenda ou le tableau de bord pour vérifier
//    un rendez-vous ou le changer (intervenante, horaire, annulation) — souvent
//    pressée, un imprévu en tête.
// 2. Ce qui saute aux yeux : qui vient, quand, où — puis, prestation par
//    prestation, qui s'en occupe, à quelle heure, combien de temps et à quel
//    prix, sur une seule ligne. La cliente (contact, avantages, préférences)
//    reste à portée dans la colonne de droite.
// 3. Quand ça se passe mal : aucune praticienne libre → la ligne le dit et
//    renvoie à « Modifier » ; praticienne demandée absente → alerte ; RDV annulé
//    → motif + « Rétablir » ; bénéficiaire sans fiche → nom sans lien.
//
// Barre du haut : « Retour » à gauche, « Modifier » à droite (RDV à venir),
// « Rétablir » (annulé) ou le statut (terminé / absence). Plus de
// « Reprogrammer » : on déplace un rendez-vous depuis « Modifier ».
// L'intervenante d'une prestation à venir se change sur sa ligne (sélecteur
// limité aux praticiennes compétentes, présentes et libres —
// `availablePractitioners`).

const CATEGORY_ICON: { match: string; Icon: typeof Scissors }[] = [
  { match: "Mini & Co", Icon: Baby },
  { match: "Coiffure", Icon: Scissors },
  { match: "Manucure", Icon: Hand },
  { match: "Onglerie", Icon: Hand },
  { match: "Soin du visage", Icon: Sparkles },
  { match: "Spa", Icon: Flower2 },
  { match: "Épilation", Icon: Feather },
];
const categoryIcon = (category: string) => CATEGORY_ICON.find((c) => category.startsWith(c.match))?.Icon ?? Sparkles;

/** Préférences d'une fiche, toujours visibles (lecture compacte, comme la caisse). */
function PreferencesCompact({ detail, className }: { detail: ClientDetail; className?: string }) {
  const { questions } = usePreferenceConfig();
  const lines = preferenceLines(detail.preferences, questions);
  return (
    <div className={cn("rounded-box bg-base-200 px-3 py-2", className)}>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-base-content/55 uppercase">Préférences</p>
      {lines.length > 0 ? (
        <dl className="mt-1 grid grid-cols-[max-content_1fr] items-baseline gap-x-3 gap-y-2">
          {lines.map((pref) => (
            <div key={pref.label} className="contents">
              <dt className="text-xs text-base-content/55">{pref.label}</dt>
              <dd className="flex flex-col gap-0.5 text-sm leading-snug text-base-content">
                {pref.notes.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-1 text-xs text-base-content/55">Aucune préférence notée</p>
      )}
    </div>
  );
}

type Group = {
  key: string;
  label: string;
  href: string | null;
  kind: BeneficiaryKind;
  clientId: string | null;
  lines: RdvPrestation[];
};

function beneficiaryGroups(r: RdvDetail): Group[] {
  const groups = new Map<string, Group>();
  for (const p of r.prestations) {
    const key = beneficiaryKey(p, r.client.name);
    if (!groups.has(key)) {
      const clientId = key === "__payer__" ? r.client.id : (p.beneficiaryClientId ?? null);
      // Le nom de la payeuse plutôt qu'un générique ; pour un bénéficiaire sans
      // fiche, son prénom sans la précision entre parenthèses (« 7 ans »).
      const label = key === "__payer__" ? r.client.name : p.beneficiaryName.replace(/\s*\([^)]*\)\s*$/, "");
      groups.set(key, {
        key,
        label,
        href: clientId ? `/clients/${clientId}` : null,
        kind: beneficiaryKindOf(p),
        clientId,
        lines: [],
      });
    }
    groups.get(key)!.lines.push(p);
  }
  return [...groups.values()].sort(
    (a, b) =>
      Math.min(...a.lines.map((p) => timeToMinutes(p.start))) - Math.min(...b.lines.map((p) => timeToMinutes(p.start))),
  );
}

// Praticienne résolue par son nom (le RDV ne référence qu'un nom).
const memberByName = (name: string) => members.find((m) => fullName(m) === name) ?? null;

// « Jeudi 3 septembre 2026 »
function formatLongDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Praticienne sur une ligne de prestation : photo (ou initiales teintées de son accent) + prénom, ou sélecteur. */
function StaffPick({
  name,
  options,
  onChange,
  label,
  noneLabel,
}: {
  name: string | null;
  options: string[];
  onChange?: (value: string) => void;
  label: string;
  noneLabel?: string;
}) {
  const member = name ? memberByName(name) : null;
  const accent = member ? accentForMemberId(member.id) : null;
  const avatar = name ? (
    <Avatar
      photoUrl={member?.photo}
      initial={initialsOf(name)}
      size={28}
      className="text-[11px] font-semibold"
      style={accent ? { background: accent.bg, color: accent.text } : undefined}
    />
  ) : (
    <span className="size-7 shrink-0 rounded-full border border-dashed border-base-300" />
  );
  const changeable = onChange && options.length > 1;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {avatar}
      {changeable ? (
        <select
          value={name ?? "__none__"}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className="select select-sm min-w-0 flex-1 border-base-300 bg-base-100 text-sm font-medium text-base-content"
        >
          {noneLabel && <option value="__none__">{noneLabel}</option>}
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      ) : (
        <span className="truncate text-sm font-medium text-base-content">{name ?? noneLabel}</span>
      )}
    </div>
  );
}

// Colonnes du tableau des prestations — partagées par l'en-tête, les lignes et le total.
const COLS = "grid grid-cols-[minmax(0,1fr)_116px_212px_108px] items-center gap-x-4";

export default function RendezVousDetail({
  detail: detailProp,
  onClose,
  onAssign,
  onStatusChange,
  rdvs,
  onUpdatePrestation,
  onReschedule,
  onCancelWithReason,
  planningData,
}: {
  detail: RdvDetail;
  // Présente cette fiche « branchée » sur l'état de session de l'écran
  // Rendez-vous ; sans ces props (route dédiée), elle reste autonome et ses
  // changements sont locaux.
  onClose?: () => void;
  onAssign?: (prestationId: string, staff: string) => void;
  onStatusChange?: (status: RdvStatus) => void;
  rdvs?: RdvDetail[];
  onUpdatePrestation?: (prestationId: string, patch: Partial<RdvPrestation>) => void;
  onReschedule?: (next: Reschedule) => void;
  onCancelWithReason?: (reason: string) => void;
  planningData?: PlanningData;
}) {
  const router = useRouter();
  // Sans écran Rendez-vous derrière (route dédiée), une reprogrammation reste
  // locale à cette fiche.
  const [localDetail, setLocalDetail] = useState(detailProp);
  const detail = onReschedule ? detailProp : localDetail;
  // Id fixe : `useId` divergeait entre rendu serveur et client sur cette route.
  const titleId = "rdv-detail-title";
  const close = () => {
    if (onClose) onClose();
    else if (window.history.length > 1) router.back();
    else router.push("/rendez-vous");
  };
  const day = detail.date.slice(0, 10);
  const { getDetail, notesFor } = useClientsData();

  // La page s'ouvre à la place de la liste : on repart du haut.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [detail.id]);

  const [status, setStatusState] = useState<RdvStatus>(detail.status);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(detail.cancelReason ?? "");
  const [editOpen, setEditOpen] = useState(false);
  // Changements d'intervenante faits depuis cette fiche en mode autonome.
  const [perStaff, setPerStaff] = useState<Record<string, string>>({});
  const [perSecond, setPerSecond] = useState<Record<string, string | null>>({});
  const staffOf = (p: RdvPrestation) => perStaff[p.id] ?? p.staff;
  const secondOf = (p: RdvPrestation) => (p.id in perSecond ? perSecond[p.id] : (p.secondStaff ?? null));
  const sessionList = useMemo(() => rdvs ?? allRendezvous(), [rdvs]);

  const setStatus = (next: RdvStatus) => {
    setStatusState(next);
    onStatusChange?.(next);
  };

  const cancelled = status === "annulé";
  const upcoming = status === "à venir";
  const payer = getDetail(detail.client.id);
  const lastNote = notesFor(detail.client.id)[0];
  const extras = detail.extras ?? [];
  const coverage = useMemo(() => rdvCoverage(detail.client.id, detail.prestations), [detail]);
  const billable = (p: RdvPrestation) => !coverage.has(p.id);
  const total =
    detail.prestations.filter(billable).reduce((s, p) => s + p.price, 0) + extras.reduce((s, e) => s + extraPrice(e), 0);
  const coveredCount = detail.prestations.length - detail.prestations.filter(billable).length;
  const groups = beneficiaryGroups(detail);
  const multi = groups.length > 1;
  const conflicts = upcoming ? detail.prestations.filter((p) => !staffOf(p)).length : 0;

  // Avantages de la payeuse.
  const gift = detail.advantages.find((a) => a.kind === "carte-cadeau") ?? null;
  const giftCard = gift && gift.kind === "carte-cadeau" ? gift : clientGiftCard(detail.client.id);
  const abonnements = clientAbonnements(detail.client.id).filter((ab) => statusOf(ab) !== "revoked");
  const packs = clientPacks(detail.client.id).filter((pp) => packRemaining(pp).length > 0);
  const points = payer?.row.loyaltyPoints ?? detail.client.loyaltyPoints;
  const hasAvantages = points > 0 || Boolean(giftCard) || abonnements.length > 0 || packs.length > 0;

  // Praticienne demandée par la cliente mais absente ce jour-là.
  const presentRoster = useMemo(() => presentPractitioners(detail.salon, day, planningData), [detail.salon, day, planningData]);
  const requestedAbsent = [
    ...new Set(detail.prestations.map((p) => p.requestedStaff).filter((n): n is string => Boolean(n))),
  ].filter((name) => !presentRoster.some((m) => fullName(m) === name));

  const phone = payer?.row.phone ?? detail.client.phone;
  const email = payer?.row.email ?? detail.client.email;
  const whatsapp = payer?.row.whatsapp;
  // Autres bénéficiaires qui ont une fiche : leurs préférences, sous celles de la payeuse.
  const others = groups
    .filter((g) => g.clientId && g.clientId !== detail.client.id)
    .map((g) => ({ label: g.label, detail: getDetail(g.clientId!) }))
    .filter((o): o is { label: string; detail: ClientDetail } => Boolean(o.detail));

  const facts: { label: string; value: string }[] = [
    { label: "Date", value: formatLongDay(day) },
    { label: "Horaire", value: `${rdvStartTime(detail)} – ${rdvEndTime(detail)} · ${durationLabel(rdvDuration(detail))}` },
    { label: "Salon", value: detail.salonLabel },
    { label: "Réservé pour", value: reservationComposition(detail) },
  ];

  const statusBadge =
    status === "terminé" ? (
      <Badge variant="success">Terminé</Badge>
    ) : status === "absence" ? (
      <Badge variant="warning">Absence</Badge>
    ) : cancelled ? (
      <Badge variant="neutral">Annulé</Badge>
    ) : null;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Barre du haut */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={close}
            className="-ml-2 inline-flex h-10 items-center gap-2 rounded-field px-2 text-[15px] font-medium text-base-content/75 transition hover:bg-base-300/50 hover:text-base-content"
          >
            <ArrowLeft className="size-[18px]" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            {upcoming && (
              <Button size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
                Modifier
              </Button>
            )}
            {cancelled && (
              <Button variant="outline" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => setStatus("à venir")}>
                Rétablir le rendez-vous
              </Button>
            )}
          </div>
        </div>

        {/* En-tête : qui, quand, où — et le total */}
        <header className="flex items-start justify-between gap-10 rounded-box border border-base-300 bg-base-100 px-7 py-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 id={titleId} className="text-[30px] leading-tight font-semibold tracking-[-0.01em] text-base-content">
                {detail.client.name}
              </h1>
              {payer?.row.tier && <Badge variant={payer.row.tier}>{TIER_LABEL[payer.row.tier]}</Badge>}
              {statusBadge}
            </div>
            <p className="mt-1 text-sm tabular-nums text-base-content/55">Rendez-vous n° {detail.id}</p>
            <dl className="mt-5 grid grid-cols-[repeat(4,minmax(0,auto))] justify-start gap-x-10 gap-y-3">
              {facts.map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-xs text-base-content/55">{f.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-base-content">{f.value}</dd>
                </div>
              ))}
            </dl>
            {cancelled && (detail.cancelReason || cancelReason) && (
              <p className="mt-4 text-sm text-base-content/70">
                <span className="font-semibold text-base-content">Motif de l&apos;annulation :</span> {detail.cancelReason || cancelReason}
              </p>
            )}
          </div>
          <div className="shrink-0 border-l border-base-300 pl-8 text-right">
            <p className="text-xs text-base-content/55">Total à régler</p>
            <p className={cn("mt-0.5 text-[30px] leading-tight font-semibold tabular-nums", cancelled ? "text-base-content/40 line-through" : "text-base-content")}>
              {fcfa(total)}
            </p>
            {(coveredCount > 0 || extras.length > 0) && (
              <p className="mt-1 text-xs tabular-nums text-base-content/55">
                {coveredCount > 0
                  ? `${coveredCount} prestation${coveredCount > 1 ? "s" : ""} couverte${coveredCount > 1 ? "s" : ""} par une offre`
                  : "Boissons & produits compris"}
              </p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)_330px] items-start gap-6">
          {/* Colonne principale */}
          <div className="flex min-w-0 flex-col gap-6">
            {requestedAbsent.length > 0 && upcoming && (
              <Alert
                tone="warning"
                title="Praticienne demandée absente ce jour-là"
                description={`La cliente a demandé ${requestedAbsent.join(", ")}. Une autre praticienne lui a été affectée.`}
              />
            )}
            {conflicts > 0 && (
              <Alert
                tone="warning"
                title={`${conflicts} prestation${conflicts > 1 ? "s" : ""} sans praticienne disponible`}
                description="Personne de compétent n'est libre à cet horaire. Modifiez le rendez-vous pour le déplacer."
              />
            )}

            <section className="rounded-box border border-base-300 bg-base-100">
              <div className="flex items-baseline justify-between gap-4 px-6 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-base-content">Prestations</h2>
                <span className="text-sm tabular-nums text-base-content/55">
                  {detail.prestations.length} prestation{detail.prestations.length > 1 ? "s" : ""} · {durationLabel(rdvDuration(detail))}
                </span>
              </div>

              <div className={cn(COLS, "border-y border-base-300 bg-base-200 px-6 py-2 text-xs font-medium text-base-content/55")}>
                <span>Prestation</span>
                <span>Horaire</span>
                <span>Praticienne</span>
                <span className="text-right">Prix</span>
              </div>

              {groups.map((group, gi) => {
                const groupTotal = group.lines.filter(billable).reduce((s, p) => s + p.price, 0);
                return (
                  <div key={group.key} className={cn(gi > 0 && "border-t border-base-300")}>
                    {multi && (
                      <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-1">
                        <span className="inline-flex items-center gap-2">
                          {group.href ? (
                            <Link
                              href={group.href}
                              className="text-sm font-semibold text-base-content underline decoration-base-300 decoration-1 underline-offset-4 transition hover:decoration-primary"
                            >
                              {group.label}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-base-content">{group.label}</span>
                          )}
                          {group.kind !== "femme" && (
                            <span className="rounded-sm bg-accent px-2 py-0.5 text-xs font-semibold text-secondary">
                              {group.kind === "homme" ? "Homme" : "Enfant"}
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-base-content/55">
                          {groupTotal === 0 && group.lines.some((l) => coverage.has(l.id)) ? "Couvert par une offre" : fcfa(groupTotal)}
                        </span>
                      </div>
                    )}
                    <ul className="divide-y divide-base-300">
                      {group.lines.map((p) => {
                        const Icon = categoryIcon(p.category);
                        const covered = coverage.get(p.id);
                        const current = staffOf(p);
                        const second = secondOf(p);
                        const free = upcoming
                          ? availablePractitioners(sessionList, p.prestationId, detail.salon, day, timeToMinutes(p.start), p.durationMin, {
                              data: planningData,
                              excludeRdvId: detail.id,
                            })
                          : [];
                        const options = current && !free.includes(current) ? [current, ...free] : free;
                        const twoPractitioners = prestationSeeds.find((x) => x.id === p.prestationId)?.twoPractitioners;
                        const secondOptions = free.filter((n) => n !== current);
                        const secondList = second && !secondOptions.includes(second) ? [second, ...secondOptions] : secondOptions;
                        const end = minutesToTime(timeToMinutes(p.start) + p.durationMin);
                        return (
                          <li key={p.id} className={cn(COLS, "px-6 py-3.5")}>
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
                                <Icon className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[15px] leading-snug font-semibold text-base-content">{p.name}</p>
                                <p className="mt-0.5 text-xs text-base-content/55">{p.category}</p>
                                {covered && <p className="mt-0.5 text-xs font-medium text-secondary">Couverte · {covered}</p>}
                                {p.answers?.map((a) => (
                                  <p key={a.questionId} title={a.question} className="mt-1.5 flex items-center gap-2">
                                    {a.photo ? (
                                      // eslint-disable-next-line @next/next/no-img-element -- photo de réponse (public/ ou dataURL)
                                      <img src={a.photo} alt="" className="h-11 w-9 shrink-0 rounded-[6px] object-cover" />
                                    ) : null}
                                    <span className="min-w-0">
                                      <span className="block text-[13px] leading-tight font-medium text-base-content">{a.option}</span>
                                      <span className="block truncate text-xs leading-tight text-base-content/50">{a.question}</span>
                                    </span>
                                  </p>
                                ))}
                              </div>
                            </div>
                            <div className="tabular-nums">
                              <p className="text-sm font-medium text-base-content">
                                {p.start} – {end}
                              </p>
                              <p className="mt-0.5 text-xs text-base-content/55">{durationLabel(p.durationMin)}</p>
                            </div>
                            <div className="flex min-w-0 flex-col gap-1.5">
                              {current ? (
                                <StaffPick
                                  name={current}
                                  options={options}
                                  label={`Praticienne pour ${p.name}`}
                                  onChange={
                                    upcoming
                                      ? (value) => {
                                          setPerStaff((prev) => ({ ...prev, [p.id]: value }));
                                          onAssign?.(p.id, value);
                                        }
                                      : undefined
                                  }
                                />
                              ) : (
                                <span className="text-sm font-medium text-warning">
                                  {upcoming ? "Aucune disponible" : "Non précisée"}
                                </span>
                              )}
                              {current && (second || (upcoming && twoPractitioners && secondList.length > 0)) && (
                                <StaffPick
                                  name={second}
                                  options={secondList}
                                  noneLabel={upcoming && twoPractitioners ? "+ 2ᵉ praticienne" : undefined}
                                  label={`Deuxième praticienne pour ${p.name}`}
                                  onChange={
                                    upcoming && twoPractitioners
                                      ? (v) => {
                                          const value = v === "__none__" ? null : v;
                                          setPerSecond((prev) => ({ ...prev, [p.id]: value }));
                                          onUpdatePrestation?.(p.id, { secondStaff: value });
                                        }
                                      : undefined
                                  }
                                />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-right text-[15px] font-semibold tabular-nums",
                                covered ? "text-base-content/40 line-through" : "text-base-content",
                              )}
                            >
                              {fcfa(p.price)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              {extras.length > 0 && (
                <>
                  <div className="border-y border-base-300 px-6 pt-4 pb-2">
                    <span className="text-sm font-semibold text-base-content">Boissons & produits</span>
                  </div>
                  <ul className="divide-y divide-base-300">
                    {extras.map((e) => {
                      const boisson = productKind(e.productId) === "boisson";
                      return (
                        <li key={e.id} className={cn(COLS, "px-6 py-3.5")}>
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
                              {boisson ? <Coffee className="size-4" /> : <ShoppingBag className="size-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[15px] leading-snug font-semibold text-base-content">
                                {e.qty > 1 ? `${e.qty} × ` : ""}
                                {productName(e.productId)}
                              </p>
                              <p className="mt-0.5 text-xs text-base-content/55">{boisson ? "Boisson · servie sur place" : "Produit · à emporter"}</p>
                            </div>
                          </div>
                          <span />
                          <span />
                          <span className="text-right text-[15px] font-semibold tabular-nums text-base-content">{fcfa(extraPrice(e))}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="flex items-baseline justify-between border-t border-base-300 px-6 py-4">
                <span className="text-sm font-semibold text-base-content">Total</span>
                <span className="text-lg font-semibold tabular-nums text-base-content">{fcfa(total)}</span>
              </div>
            </section>

            {detail.staffNote && (
              <section className="rounded-box border border-base-300 bg-base-100 px-6 py-5">
                <h2 className="text-lg font-semibold text-base-content">Notes</h2>
                <p className="mt-2 text-sm whitespace-pre-line text-base-content">{detail.staffNote}</p>
              </section>
            )}

            {detail.questions.length > 0 && (
              <section className="rounded-box border border-base-300 bg-base-100 px-6 py-5">
                <h2 className="text-lg font-semibold text-base-content">Questions de réservation</h2>
                <dl className="mt-3 divide-y divide-base-300">
                  {detail.questions.map((q) => (
                    <div key={q.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 py-2.5 text-sm">
                      <dt className="text-base-content/65">{q.question}</dt>
                      <dd className={q.answer ? "font-medium text-base-content" : "text-base-content/45 italic"}>{q.answer ?? "Sans réponse"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="rounded-box border border-base-300 bg-base-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-base-content">Historique</h2>
              <ol className="mt-3 flex flex-col gap-2.5">
                {detail.events.map((e, i) => (
                  <li key={i} className="grid grid-cols-[200px_minmax(0,1fr)] gap-4 text-sm">
                    <span className="whitespace-nowrap tabular-nums text-base-content/55">
                      {frLongDate(e.at)} · {e.at.slice(11, 16)}
                    </span>
                    <span className="text-base-content/75">
                      <span className="font-semibold text-base-content">{e.label}</span>
                      {e.detail && ` · ${e.detail}`}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {upcoming && (
              <div>
                <Button variant="danger-outline" size="sm" onClick={() => setConfirmCancel(true)}>
                  Annuler le rendez-vous
                </Button>
              </div>
            )}
          </div>

          {/* La cliente */}
          <aside className="sticky top-6 flex flex-col gap-4">
            <section className="rounded-box border border-base-300 bg-base-100 p-5">
              <div className="flex items-center gap-3">
                <Avatar initial={initialsOf(detail.client.name)} size={44} className="bg-accent text-sm font-semibold text-secondary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-base-content">{detail.client.name}</p>
                  <p className="text-xs text-base-content/55">Payeuse</p>
                </div>
                <Button href={`/clients/${detail.client.id}`} variant="outline" size="sm" icon={<UserRound className="size-4" />}>
                  Fiche
                </Button>
              </div>

              <ul className="mt-4 flex flex-col gap-1 border-t border-base-300 pt-3 text-sm">
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 rounded-field px-1 py-1.5 text-base-content transition hover:bg-base-200">
                      <Phone className="size-4 text-base-content/55" />
                      <span className="tabular-nums">{phone}</span>
                    </a>
                  </li>
                )}
                {whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-field px-1 py-1.5 text-base-content transition hover:bg-base-200"
                    >
                      <MessageCircle className="size-4 text-base-content/55" />
                      <span className="tabular-nums">WhatsApp · {whatsapp}</span>
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a href={`/messagerie/envoyer?client=${detail.client.id}`} className="flex min-w-0 items-center gap-2.5 rounded-field px-1 py-1.5 text-base-content transition hover:bg-base-200">
                      <Mail className="size-4 shrink-0 text-base-content/55" />
                      <span className="truncate">{email}</span>
                    </a>
                  </li>
                )}
              </ul>

              {hasAvantages && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-base-300 pt-4">
                  {points > 0 && <AvantageChip icon={<Star className="size-3.5" />}>{points} pts</AvantageChip>}
                  {giftCard && <AvantageChip icon={<Gift className="size-3.5" />}>Carte cadeau · {fcfa(giftCard.balance)}</AvantageChip>}
                  {packs.map((pp) => {
                    const pack = packById(pp.packId);
                    if (!pack) return null;
                    const remaining = packRemaining(pp).length;
                    return (
                      <AvantageChip key={pp.id} icon={<PackageCheck className="size-3.5" />}>
                        {pack.label} · {remaining} restante{remaining > 1 ? "s" : ""} sur {pack.prestationIds.length}
                      </AvantageChip>
                    );
                  })}
                  {abonnements.map((ab) => {
                    const forfait = forfaitById(ab.forfaitId);
                    if (!forfait) return null;
                    const s = statusOf(ab);
                    return (
                      <AvantageChip key={ab.id} icon={<CalendarClock className="size-3.5" />} badge={{ label: ABONNEMENT_STATUS_META[s].label, warning: s === "due" }}>
                        {forfait.label}
                      </AvantageChip>
                    );
                  })}
                </div>
              )}

              {payer && <PreferencesCompact detail={payer} className="mt-4" />}
              {lastNote && (
                <div className="mt-3 rounded-box bg-base-200 px-3 py-2">
                  <Legend className="text-base-content/55">
                    Dernière note · {new Date(lastNote.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </Legend>
                  <p className="mt-1 text-sm leading-snug text-base-content/75">{lastNote.text}</p>
                </div>
              )}
            </section>

            {others.map((o) => (
              <section key={o.label} className="rounded-box border border-base-300 bg-base-100 p-5">
                <p className="text-sm font-semibold text-base-content">{o.label}</p>
                <PreferencesCompact detail={o.detail} className="mt-3" />
              </section>
            ))}
          </aside>
        </div>
      </div>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} labelledBy={`${titleId}-cancel`} className="max-w-sm p-6">
        <h3 id={`${titleId}-cancel`} className="text-lg font-semibold text-base-content">
          Annuler ce rendez-vous ?
        </h3>
        <p className="mt-2 text-sm text-base-content/60">
          Toutes ses prestations passeront au statut Annulé ; le rendez-vous reste retrouvable par son numéro. La cliente est prévenue
          par email.
        </p>
        <Field label="Motif (facultatif)" className="mt-4">
          <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2} placeholder="Ex. la cliente a décalé sa venue" />
        </Field>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmCancel(false)}>
            Retour
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              setStatusState("annulé");
              if (onCancelWithReason) onCancelWithReason(cancelReason.trim());
              else onStatusChange?.("annulé");
              setConfirmCancel(false);
            }}
          >
            Annuler le rendez-vous
          </Button>
        </div>
      </Dialog>

      {editOpen && (
        <RdvDialog
          open={editOpen}
          detail={detail}
          rdvs={sessionList}
          planningData={planningData}
          onClose={() => setEditOpen(false)}
          onConfirm={(next) => {
            if (onReschedule) onReschedule(next);
            else
              setLocalDetail((d) => ({
                ...d,
                date: next.date,
                salon: next.salon,
                salonLabel: salonName(next.salon),
                prestations: next.prestations,
                extras: next.extras,
                questions: next.questions,
                staffNote: next.staffNote,
              }));
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}
