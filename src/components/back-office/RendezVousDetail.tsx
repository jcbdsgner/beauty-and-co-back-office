"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Baby,
  CalendarClock,
  Coffee,
  Feather,
  Flower2,
  Gift,
  Hand,
  PackageCheck,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  UserRound,
  Users,
} from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { Field } from "@/components/ui/molecules/field";
import { Alert } from "@/components/ui/molecules/alert";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Textarea } from "@/components/ui/atoms/textarea";
import { cn } from "@/lib/utils";
import { fullName } from "@/lib/mock/staff";
import { presentPractitioners, type PlanningData } from "@/lib/mock/planning";
import { preferenceLines } from "@/lib/mock/preference-targets";
import { TIER_LABEL, type ClientDetail } from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import { usePreferenceConfig } from "@/context/PreferencesContext";
import { prestationSeeds, productKind, productName } from "@/lib/mock/services";
import { ABONNEMENT_STATUS_META, forfaitById, packById } from "@/lib/mock/abonnements";
import {
  allRendezvous,
  availablePractitioners,
  beneficiaryKey,
  beneficiaryKindOf,
  extraPrice,
  fcfa,
  frLongDate,
  rdvEndTime,
  rdvStartTime,
  reservationComposition,
  timeToMinutes,
  type BeneficiaryKind,
  type RdvDetail,
  type RdvPrestation,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import EditRdvDialog from "./rendezvous/EditRdvDialog";
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

// Fiche rendez-vous — le panneau latéral de réservation de point-de-vente,
// qui fait autorité (`components/planning/appointment-detail-sheet.tsx`,
// ADR 0023) : en tête la référence de la réservation, son créneau et « Réservé
// pour 1 femme + 1 enfant » ; puis la payeuse (palier, « Fiche », puces
// d'avantages, préférences toujours visibles, dernière note) ; puis les
// prestations groupées par bénéficiaire (lien vers sa fiche, Homme / Enfant,
// sous-total, ses préférences), chacune avec sa praticienne et, si un pack /
// abonnement la couvre, « Couverte · <offre> » et le prix barré ; les extras ;
// le Total ; « Modifier » et « Annuler la réservation » (motif facultatif).
//
// Écarts back-office : pas d'« Encaisser » ; l'intervenante de chaque
// prestation à venir se change ici (sélecteur limité aux praticiennes
// compétentes, présentes et libres — `availablePractitioners` ; plus aucun
// « à affecter », cf. affectation automatique) ; une réservation annulée se
// rétablit ; l'historique de la réservation en pied.
//
// closeMode "back" : ouverte depuis l'admin (route interceptée) → referme sur
// l'écran d'origine. "list" : accès direct → referme vers /rendez-vous.

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

// « Jeu. 3 sept » — jour court pour la ligne de créneau.
function formatShortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, d)
    .toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\.$/, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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

export default function RendezVousDetail({
  detail,
  closeMode,
  onClose,
  onAssign,
  onStatusChange,
  rdvs,
  onUpdatePrestation,
  onAddPrestation,
  onRemovePrestation,
  onCancelWithReason,
  planningData,
}: {
  detail: RdvDetail;
  closeMode: "back" | "list";
  // Présente cette fiche « branchée » sur l'état de session de l'écran
  // Rendez-vous ; sans ces props (route dédiée / interceptée), elle reste
  // autonome et ses changements sont locaux.
  onClose?: () => void;
  onAssign?: (prestationId: string, staff: string) => void;
  onStatusChange?: (status: RdvStatus) => void;
  rdvs?: RdvDetail[];
  onUpdatePrestation?: (prestationId: string, patch: Partial<RdvPrestation>) => void;
  onAddPrestation?: (line: RdvPrestation) => void;
  onRemovePrestation?: (prestationId: string) => void;
  onCancelWithReason?: (reason: string) => void;
  planningData?: PlanningData;
}) {
  const router = useRouter();
  const titleId = useId();
  const close = () => (onClose ? onClose() : closeMode === "back" ? router.back() : router.push("/rendez-vous"));
  const day = detail.date.slice(0, 10);
  const { getDetail, notesFor } = useClientsData();

  const [status, setStatusState] = useState<RdvStatus>(detail.status);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(detail.cancelReason ?? "");
  const [editOpen, setEditOpen] = useState(false);
  // Changement d'intervenante fait depuis cette fiche en mode autonome.
  const [perStaff, setPerStaff] = useState<Record<string, string>>({});
  const staffOf = (p: RdvPrestation) => perStaff[p.id] ?? p.staff;
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
  const groups = beneficiaryGroups(detail);

  // Avantages de la payeuse — puces de la ligne de résumé.
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

  const staffLabel = (p: RdvPrestation) => {
    const first = staffOf(p);
    if (!first) return null;
    const first1 = first.split(" ")[0];
    return p.secondStaff ? `${first1} + ${p.secondStaff.split(" ")[0]} · à 2` : first1;
  };

  return (
    <>
      <Dialog open variant="side" onClose={close} labelledBy={titleId} className="relative flex max-w-xl flex-col p-0">
        <CloseButton onClick={close} />

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-base-300 bg-base-100 py-4 pr-16 pl-6">
          {/* Référence de la réservation plutôt que le nom de la payeuse — son nom est juste en dessous. */}
          <h2 id={titleId} className="text-xl font-semibold tabular-nums text-base-content">
            {detail.id}
          </h2>
          {cancelled && <Badge variant="neutral">Annulé</Badge>}
          {status === "terminé" && <Badge variant="success">Terminé</Badge>}
          {status === "absence" && <Badge variant="warning">Absence</Badge>}
          <span className="w-full text-xs text-base-content/55">
            {formatShortDay(day)} · {rdvStartTime(detail)} – {rdvEndTime(detail)} · {detail.salonLabel} · Réservé pour{" "}
            {reservationComposition(detail)}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* La payeuse */}
          <div className="border-b border-base-300 px-6 py-4">
            <div className="flex items-center gap-3">
              <Avatar initial={initialsOf(detail.client.name)} size={48} className="bg-accent text-base font-semibold text-primary" />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-base-content">{detail.client.name}</span>
                {payer?.row.tier && <Badge variant={payer.row.tier}>{TIER_LABEL[payer.row.tier]}</Badge>}
              </div>
              <Button href={`/clients/${detail.client.id}`} variant="outline" size="sm" icon={<UserRound className="size-4" />} className="shrink-0">
                Fiche
              </Button>
            </div>

            {hasAvantages && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {points > 0 && <AvantageChip icon={<Star className="size-3.5" />}>{points} pts</AvantageChip>}
                {giftCard && (
                  <AvantageChip icon={<Gift className="size-3.5" />}>Carte cadeau · {fcfa(giftCard.balance)}</AvantageChip>
                )}
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
                    <AvantageChip
                      key={ab.id}
                      icon={<CalendarClock className="size-3.5" />}
                      badge={{ label: ABONNEMENT_STATUS_META[s].label, warning: s === "due" }}
                    >
                      {forfait.label}
                    </AvantageChip>
                  );
                })}
              </div>
            )}

            {/* Préférences toujours visibles, jamais derrière un dépliage. */}
            <div className="mt-3 flex flex-col gap-3">
              {payer && <PreferencesCompact detail={payer} />}
              {lastNote && (
                <div className="rounded-lg bg-base-200 px-3 py-2">
                  <Legend className="text-base-content/55">
                    Dernière note · {new Date(lastNote.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </Legend>
                  <p className="mt-1 text-xs leading-snug text-base-content/70">{lastNote.text}</p>
                </div>
              )}
            </div>
          </div>

          {requestedAbsent.length > 0 && upcoming && (
            <div className="border-b border-base-300 px-6 py-4">
              <Alert
                tone="warning"
                title="Praticienne demandée absente ce jour-là"
                description={`La cliente a demandé ${requestedAbsent.join(", ")}. Une autre praticienne lui a été affectée.`}
              />
            </div>
          )}

          {/* Prestations, groupées par bénéficiaire */}
          {groups.map((group) => {
            const groupTotal = group.lines.filter(billable).reduce((s, p) => s + p.price, 0);
            const other = group.clientId && group.clientId !== detail.client.id ? getDetail(group.clientId) : null;
            return (
              <div key={group.key} className="border-b border-base-300 px-6 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    {group.href ? (
                      <Link
                        href={group.href}
                        className="text-sm font-semibold text-base-content underline decoration-base-300 decoration-1 underline-offset-2 transition hover:decoration-primary"
                      >
                        {group.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-base-content">{group.label}</span>
                    )}
                    {group.kind !== "femme" && (
                      <span className="rounded-sm bg-accent px-2 py-0.5 text-xs font-semibold tracking-wide text-primary uppercase">
                        {group.kind === "homme" ? "Homme" : "Enfant"}
                      </span>
                    )}
                  </span>
                  {group.lines.length > 1 && (
                    <span className="text-xs font-semibold tabular-nums text-base-content/55">{fcfa(groupTotal)}</span>
                  )}
                </div>

                {other && <PreferencesCompact detail={other} className="mt-2" />}

                <div className="mt-2 flex flex-col divide-y divide-base-300">
                  {group.lines.map((p) => {
                    const Icon = categoryIcon(p.category);
                    const covered = coverage.get(p.id);
                    const label = staffLabel(p);
                    const current = staffOf(p);
                    const free = upcoming
                      ? availablePractitioners(sessionList, p.prestationId, detail.salon, day, timeToMinutes(p.start), p.durationMin, {
                          data: planningData,
                          excludeRdvId: detail.id,
                        })
                      : [];
                    const options = current && !free.includes(current) ? [current, ...free] : free;
                    const twoPractitioners = prestationSeeds.find((x) => x.id === p.prestationId)?.twoPractitioners;
                    const seconds = free.filter((n) => n !== current);
                    return (
                      <div key={p.id} className="flex items-start gap-3 py-2.5">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-base-content">{p.name}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-content/55">
                            <span className="tabular-nums">{p.start}</span>
                            {label ? (
                              <span className="inline-flex items-center gap-1">
                                {p.secondStaff ? <Users className="size-3" /> : <User className="size-3" />} {label}
                              </span>
                            ) : (
                              <span className="font-medium text-warning">
                                {upcoming ? "Aucune praticienne disponible — à déplacer" : "Praticienne non précisée"}
                              </span>
                            )}
                            {covered && (
                              <span className="rounded-sm bg-muted px-2 py-0.5 font-semibold text-base-content/65">Couverte · {covered}</span>
                            )}
                          </p>
                          {upcoming && current && options.length > 1 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <select
                                value={current}
                                aria-label={`Intervenante pour ${p.name}`}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setPerStaff((prev) => ({ ...prev, [p.id]: value }));
                                  onAssign?.(p.id, value);
                                }}
                                className="select select-sm w-auto bg-base-100 text-sm"
                              >
                                {options.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                              {twoPractitioners && (
                                <select
                                  value={p.secondStaff ?? "__none__"}
                                  aria-label={`Deuxième praticienne pour ${p.name}`}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    onUpdatePrestation?.(p.id, { secondStaff: v === "__none__" ? null : v });
                                  }}
                                  className="select select-sm w-auto bg-base-100 text-sm"
                                >
                                  <option value="__none__">Seule</option>
                                  {[...(p.secondStaff && !seconds.includes(p.secondStaff) ? [p.secondStaff] : []), ...seconds].map((name) => (
                                    <option key={name} value={name}>
                                      2ᵉ praticienne : {name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            covered ? "text-base-content/40 line-through" : "text-base-content/85",
                          )}
                        >
                          {fcfa(p.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {extras.length > 0 && (
            <div className="border-b border-base-300 px-6 py-4">
              <Legend>Extras</Legend>
              <div className="mt-2 flex flex-col divide-y divide-base-300">
                {extras.map((e) => {
                  const boisson = productKind(e.productId) === "boisson";
                  return (
                    <div key={e.id} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                        {boisson ? <Coffee className="size-4" /> : <ShoppingBag className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-base-content">
                          {e.qty > 1 ? `${e.qty}× ` : ""}
                          {productName(e.productId)}
                        </p>
                        <p className="mt-0.5 text-xs text-base-content/55">
                          {boisson ? "Boisson · à retirer sur place" : "Produit · à emporter"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-base-content/85">{fcfa(extraPrice(e))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detail.questions.length > 0 && (
            <div className="border-b border-base-300 px-6 py-4">
              <Legend>Questions de réservation</Legend>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
                {detail.questions.map((q) => (
                  <div key={q.id} className="contents">
                    <dt className="text-base-content/55">{q.question}</dt>
                    <dd className={q.answer ? "text-base-content" : "text-base-content/45 italic"}>{q.answer ?? "Sans réponse"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="px-6 py-4">
            <Legend>Historique</Legend>
            <ol className="mt-2 flex flex-col gap-2">
              {detail.events.map((e, i) => (
                <li key={i} className="text-xs text-base-content/60">
                  <span className="font-semibold text-base-content/80">{e.label}</span>
                  {e.detail && ` · ${e.detail}`}
                  <span className="text-base-content/45">
                    {" "}
                    — {frLongDate(e.at)} · {e.at.slice(11, 16)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="shrink-0 border-t border-base-300 px-6 py-3">
          <div className="flex items-baseline justify-between">
            <Legend>Total</Legend>
            <span className="text-xl font-bold tabular-nums text-base-content">{fcfa(total)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 p-5">
          {upcoming && (
            <div className="flex gap-2">
              <Button variant="outline" icon={<SlidersHorizontal className="size-4" />} className="shrink-0 px-6" onClick={() => setEditOpen(true)}>
                Modifier
              </Button>
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="btn btn-ghost btn-md flex-1 border-transparent text-[16px] font-medium whitespace-nowrap text-error normal-case hover:bg-error/10 active:scale-[0.97]"
              >
                Annuler la réservation
              </button>
            </div>
          )}
          {cancelled && (
            <>
              {(detail.cancelReason || cancelReason) && (
                <p className="px-1 text-xs text-base-content/55">Motif : {detail.cancelReason || cancelReason}</p>
              )}
              <Button variant="outline" onClick={() => setStatus("à venir")}>
                Rétablir la réservation
              </Button>
            </>
          )}
        </div>
      </Dialog>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} labelledBy={`${titleId}-cancel`} className="max-w-sm p-6">
        <h3 id={`${titleId}-cancel`} className="text-lg font-semibold text-base-content">
          Annuler cette réservation ?
        </h3>
        <p className="mt-2 text-sm text-base-content/55">
          Toutes ses prestations passeront au statut Annulé et resteront consultables via « Afficher les annulés ». La cliente est
          prévenue par email.
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
            Annuler la réservation
          </Button>
        </div>
      </Dialog>

      {editOpen && (
        <EditRdvDialog
          open={editOpen}
          detail={detail}
          rdvs={rdvs ?? [detail]}
          planningData={planningData}
          onClose={() => setEditOpen(false)}
          onUpdateLine={(pid, patch) => onUpdatePrestation?.(pid, patch)}
          onAddLine={(line) => onAddPrestation?.(line)}
          onRemoveLine={(pid) => onRemovePrestation?.(pid)}
          onCancelRdv={(reason) => {
            setStatusState("annulé");
            setCancelReason(reason);
            if (onCancelWithReason) onCancelWithReason(reason);
            else onStatusChange?.("annulé");
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}
