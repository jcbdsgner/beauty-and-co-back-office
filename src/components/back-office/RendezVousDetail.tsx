"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { fullName, membersForPrestation, membersInScope } from "@/lib/mock/staff";
import { presenceFor } from "@/lib/mock/planning";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChatIcon,
  DollarLineIcon,
  EnvelopeIcon,
  GroupIcon,
  PageIcon,
  ShootingStarIcon,
  TimeIcon,
  UserCircleIcon,
} from "@/icons";
import {
  RDV_STATUS_META,
  advantageLabel,
  durationLabel,
  fcfa,
  frFullDate,
  frLongDate,
  groupThousands,
  rdvDuration,
  rdvEnd,
  rdvTotal,
  type RdvAdvantage,
  type RdvDetail,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import {
  ABONNEMENT_STATUS_META,
  abonnementSeeds,
  abonnementStatus,
  availablePrestationIds,
  computeNextDueDate,
  forfaitById,
  packById,
  packPurchaseSeeds,
  packRemainingIds,
} from "@/lib/mock/abonnements";
import { getForfaitPrestations } from "@/lib/mock/forfaits";
import { getPackPrestations } from "@/lib/mock/packs";

const FIRST_AVAILABLE = "__any__";

// Fiche rendez-vous — redesign.
// 1. Où en est la propriétaire ? Elle ouvre la fiche avant l'arrivée d'une
//    cliente (qui, quand, quelles prestations, combien, qui s'en occupe, quel
//    avantage mobiliser) ou pour gérer un imprévu (annulation, réaffectation).
//    Pressée, souvent debout entre deux clientes.
// 2. Ce qui doit sauter aux yeux : la cliente, puis date/heure + salon + statut,
//    puis le total, puis les avantages disponibles.
// 3. Quand ça se passe mal : id inconnu → 404 (côté page) ; RDV annulé / absence
//    → bandeau + actions réduites ; collaboratrice non assignée → « À affecter »
//    visible ; question sans réponse → « Sans réponse » ; aucun avantage → phrase
//    explicite plutôt qu'un vide.
//
// Un rendez-vous n'a pas d'étape de confirmation. L'acompte demandé à la
// réservation est le même pour toutes (réglé dans Paiement) : la fiche n'affiche
// que le total des prestations.

const badgeColor = {
  "à venir": "info",
  terminé: "light",
  annulé: "error",
  absence: "warning",
} as const;

/* --- primitives locales ------------------------------------------------ */

function SectionCard({
  icon,
  title,
  aside,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
        <h2 className="flex-1 text-base font-semibold text-gray-800">{title}</h2>
        {aside}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-theme-sm font-medium text-gray-800">{children}</dd>
    </div>
  );
}

const inertBtn =
  "inline-flex cursor-default items-center gap-2 rounded-lg px-4 py-2.5 text-theme-sm font-medium transition-colors";

/* --- avantages -------------------------------------------------------- */

function AdvantageItem({ advantage }: { advantage: RdvAdvantage }) {
  if (advantage.kind === "abonnement") {
    const ab = abonnementSeeds.find((a) => a.id === advantage.abonnementId);
    const forfait = ab ? forfaitById(ab.forfaitId) : undefined;
    if (!ab || !forfait) return null;

    const status = abonnementStatus(ab, forfait.cycleDays);
    const meta = ABONNEMENT_STATUS_META[status];
    const resolved = getForfaitPrestations(forfait);
    const availableIds = availablePrestationIds(
      forfait.prestationIds,
      ab.redeemedPrestationIds,
    );
    const availableNames = resolved
      .filter((p) => availableIds.includes(p.id))
      .map((p) => p.label);

    return (
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 [&_svg]:h-5 [&_svg]:w-5">
          <ShootingStarIcon />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-800">{forfait.label}</p>
            <Badge size="sm" color={meta.tone}>
              {meta.label}
            </Badge>
          </div>
          <p className="text-theme-xs text-gray-500">
            {advantageLabel.abonnement} · {forfait.cycleLabel.toLowerCase()}
          </p>
          <p className="mt-2 text-theme-sm text-gray-700">
            <span className="text-gray-500">Disponible ce cycle : </span>
            {status !== "current"
              ? "aucune prestation — échéance à régler"
              : availableNames.length > 0
                ? availableNames.join(", ")
                : "toutes les prestations sont déjà consommées"}
          </p>
          <p className="mt-1 text-theme-xs text-gray-400">
            Reconduction le {frLongDate(computeNextDueDate(ab, forfait.cycleDays))}
          </p>
        </div>
      </div>
    );
  }

  if (advantage.kind === "pack") {
    const purchase = packPurchaseSeeds.find((p) => p.id === advantage.packPurchaseId);
    const pack = purchase ? packById(purchase.packId) : undefined;
    if (!purchase || !pack) return null;

    const total = pack.prestationIds.length;
    const remainingIds = packRemainingIds(purchase, pack);
    const remaining = remainingIds.length;
    const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
    const coveredNames = getPackPrestations(pack).map((p) => p.label);

    return (
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 [&_svg]:h-5 [&_svg]:w-5">
          <BoxCubeIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800">{pack.label}</p>
          <p className="text-theme-xs text-gray-500">{advantageLabel.pack}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-theme-xs font-medium tabular-nums text-gray-600">
              {remaining} / {total} prestation{total > 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-2 text-theme-sm text-gray-700">
            <span className="text-gray-500">Couvre : </span>
            {coveredNames.join(", ")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 [&_svg]:h-5 [&_svg]:w-5">
        <DollarLineIcon />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-gray-800">{advantageLabel["carte-cadeau"]}</p>
        <p className="text-theme-xs text-gray-500">Code {advantage.code}</p>
        <p className="mt-2 text-theme-sm text-gray-500">Solde disponible</p>
        <p className="text-theme-xl font-bold tabular-nums text-gray-800">
          {groupThousands(advantage.balance)}{" "}
          <span className="text-base font-semibold text-gray-400">FCFA</span>
        </p>
      </div>
    </div>
  );
}

/* --- composant principal -------------------------------------------- */

export default function RendezVousDetail({ detail }: { detail: RdvDetail }) {
  const router = useRouter();
  const day = detail.date.slice(0, 10);

  const [status, setStatus] = useState<RdvStatus>(detail.status);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = RDV_STATUS_META[status];
  const total = rdvTotal(detail);

  // Praticiennes présentes ce jour-là dans le salon (pour « assigner tout le RDV »).
  const presentRoster = useMemo(
    () =>
      membersInScope(detail.salon)
        .filter((m) => m.roles.includes("praticienne"))
        .filter((m) => presenceFor(m.id, day).state === "present"),
    [detail.salon, day],
  );

  // Affectation par prestation : nom de la praticienne, ou FIRST_AVAILABLE.
  const [perStaff, setPerStaff] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      detail.prestations.map((p) => [p.id, p.staff ?? FIRST_AVAILABLE]),
    ),
  );

  const setEveryone = (name: string) =>
    setPerStaff(Object.fromEntries(detail.prestations.map((p) => [p.id, name])));

  const staffOf = (pid: string) => {
    const v = perStaff[pid];
    return v && v !== FIRST_AVAILABLE ? v : null;
  };

  // Praticienne demandée par la cliente mais absente ce jour-là.
  const requestedAbsent = useMemo(
    () =>
      [
        ...new Set(
          detail.prestations
            .map((p) => p.requestedStaff)
            .filter((n): n is string => Boolean(n)),
        ),
      ].filter((name) => {
        const m = membersInScope(detail.salon).find((x) => fullName(x) === name);
        return !m || presenceFor(m.id, day).state !== "present";
      }),
    [detail.prestations, detail.salon, day],
  );

  // Prestations regroupées par catégorie du catalogue.
  const categories = detail.prestations.reduce<Record<string, typeof detail.prestations>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {},
  );

  const flash = (msg: string) => setNotice(msg);

  const primaryAction: { label: string; run: () => void } | null =
    status === "à venir"
      ? {
          label: "Marquer la visite terminée",
          run: () => (setStatus("terminé"), flash("Visite terminée.")),
        }
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.client.name}
        description={`Rendez-vous ${detail.ref}`}
        backHref="/rendez-vous"
        backLabel="Rendez-vous"
      />

      {/* Bandeau d'en-tête : l'essentiel + action contextuelle */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 [&_svg]:h-6 [&_svg]:w-6">
              <CalenderIcon />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Badge size="sm" color={badgeColor[status]}>
                  {meta.label}
                </Badge>
                <span className="text-theme-xs text-gray-400">{detail.ref}</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {frFullDate(detail.date)}
              </p>
              <p className="text-theme-sm text-gray-500">
                {detail.date.slice(11, 16)} → {rdvEnd(detail).slice(11, 16)} · {detail.salonLabel} ·{" "}
                {durationLabel(rdvDuration(detail))}
              </p>
            </div>
          </div>

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.run}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              {primaryAction.label}
            </button>
          )}
        </div>

        {notice && (
          <p className="mt-4 rounded-lg bg-gray-900 px-4 py-2.5 text-theme-sm font-medium text-white">
            {notice}
          </p>
        )}

        {meta.closed && status !== "terminé" && (
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-theme-sm ${
              status === "annulé"
                ? "bg-error-50 text-error-600"
                : "bg-warning-50 text-warning-600"
            }`}
          >
            {status === "annulé"
              ? "Ce rendez-vous a été annulé. Il reste consultable pour l'historique."
              : "La cliente ne s'est pas présentée. Vous pouvez la recontacter pour reprogrammer."}
          </p>
        )}

        {requestedAbsent.length > 0 && !meta.closed && (
          <div className="mt-4">
            <Alert
              variant="warning"
              title="Praticienne demandée absente ce jour-là"
              message={`La cliente a demandé ${requestedAbsent.join(
                ", ",
              )}. Affectez une autre praticienne ci-dessous, ou proposez un autre créneau.`}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne latérale — argent + avantages */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <SectionCard icon={<DollarLineIcon />} title="Total des prestations">
            <p className="text-theme-xl font-bold tabular-nums text-gray-800">{fcfa(total)}</p>
            <p className="mt-1 text-theme-xs text-gray-400">
              {detail.prestations.length} prestation{detail.prestations.length > 1 ? "s" : ""} ·{" "}
              {status === "terminé" ? "encaissé" : "à encaisser à la fin de la visite"}
            </p>
          </SectionCard>

          <SectionCard icon={<ShootingStarIcon />} title="Avantages">
            {detail.advantages.length === 0 ? (
              <p className="text-theme-sm text-gray-500">
                Aucun avantage mobilisé sur ce rendez-vous.
              </p>
            ) : (
              <div className="space-y-5">
                {detail.advantages.map((a, i) => (
                  <AdvantageItem key={i} advantage={a} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            icon={<PageIcon />}
            title="Prestations réservées"
            aside={
              <span className="text-theme-xs text-gray-400">
                {detail.prestations.length} prestation
                {detail.prestations.length > 1 ? "s" : ""} · {durationLabel(rdvDuration(detail))}
              </span>
            }
          >
            <div className="space-y-5">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category}>
                  <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                    {category}
                  </p>
                  <ul className="mt-2 divide-y divide-gray-100">
                    {items.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <p className="text-theme-xs text-gray-500">
                            {durationLabel(p.durationMin)} ·{" "}
                            {staffOf(p.id) ? (
                              staffOf(p.id)
                            ) : meta.closed ? (
                              <span className="text-gray-400">praticienne non précisée</span>
                            ) : (
                              <span className="text-warning-600">à affecter</span>
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-theme-sm font-semibold tabular-nums text-gray-800">
                          {fcfa(p.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {detail.questions.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2">
                  <ChatIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                    Questionnaire d&apos;accueil
                  </p>
                </div>
                <ol className="mt-3 space-y-3">
                  {detail.questions.map((q, i) => (
                    <li key={q.id} className="text-theme-sm">
                      <p className="text-gray-500">
                        <span className="font-medium text-gray-400">{i + 1}.</span> {q.question}
                      </p>
                      <p
                        className={`mt-0.5 font-medium ${
                          q.answer ? "text-gray-800" : "text-gray-400 italic"
                        }`}
                      >
                        {q.answer ?? "Sans réponse"}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </SectionCard>

          {status === "à venir" && (
          <SectionCard
            icon={<GroupIcon />}
            title="Affectation"
            aside={
              <span className="text-theme-xs text-gray-400">
                Praticiennes présentes le {frLongDate(detail.date)}
              </span>
            }
          >
            <label className="block">
              <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Assigner tout le rendez-vous à
              </span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && setEveryone(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
              >
                <option value="">Choisir une praticienne…</option>
                <option value={FIRST_AVAILABLE}>Première praticienne disponible</option>
                {presentRoster.map((m) => (
                  <option key={m.id} value={fullName(m)}>
                    {fullName(m)}
                  </option>
                ))}
              </select>
            </label>

            <ul className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              {detail.prestations.map((p) => {
                const options = membersForPrestation(p.prestationId, detail.salon).filter(
                  (m) => presenceFor(m.id, day).state === "present",
                );
                return (
                  <li key={p.id} className="flex items-center justify-between gap-4">
                    <span className="min-w-0 flex-1 truncate text-theme-sm text-gray-700">
                      {p.name}
                    </span>
                    <div className="shrink-0">
                      <select
                        value={perStaff[p.id] ?? FIRST_AVAILABLE}
                        onChange={(e) =>
                          setPerStaff((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="h-9 w-56 rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                      >
                        <option value={FIRST_AVAILABLE}>Première disponible</option>
                        {options.map((m) => (
                          <option key={m.id} value={fullName(m)}>
                            {fullName(m)}
                          </option>
                        ))}
                      </select>
                      {options.length === 0 && (
                        <p className="mt-1 w-56 text-theme-xs text-warning-700">
                          Aucune praticienne compétente et présente.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
          )}

          <SectionCard icon={<UserCircleIcon />} title="Coordonnées client">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <a href={`mailto:${detail.client.email}`} className="text-brand-500 hover:underline">
                  {detail.client.email}
                </a>
              </Field>
              <Field label="Téléphone">
                <span className="tabular-nums">{detail.client.phone}</span>
              </Field>
              <Field label="WhatsApp">
                {detail.client.whatsapp ? (
                  <span className="tabular-nums">{detail.client.whatsapp}</span>
                ) : (
                  <span className="text-gray-400">Non renseigné</span>
                )}
              </Field>
              <Field label="Points de fidélité">
                {groupThousands(detail.client.loyaltyPoints)} points
              </Field>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Link
                href={`/clients/${detail.client.id}`}
                className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
              >
                Voir la fiche cliente →
              </Link>
              <Link
                href="/messagerie"
                className="ml-auto inline-flex items-center gap-1.5 text-theme-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Écrire à la cliente
              </Link>
            </div>
          </SectionCard>

          <SectionCard icon={<TimeIcon />} title="Historique">
            <ol className="relative space-y-5 border-l border-gray-200 pl-5">
              {detail.events.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                      i === 0 ? "bg-brand-500" : "bg-gray-300"
                    }`}
                  />
                  <p className="text-theme-sm font-medium text-gray-800">{e.label}</p>
                  {e.detail && <p className="text-theme-xs text-gray-500">{e.detail}</p>}
                  <p className="mt-0.5 text-theme-xs text-gray-400">
                    {frLongDate(e.at)} · {e.at.slice(11, 16)}
                  </p>
                </li>
              ))}
            </ol>
          </SectionCard>

          {/* Actions de gestion */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5">
            {!meta.closed && (
              <Link
                href="/rendez-vous"
                className={`${inertBtn} border border-gray-200 text-gray-700 hover:bg-gray-50`}
              >
                <CalenderIcon className="h-4 w-4" />
                Déplacer (depuis l&apos;agenda)
              </Link>
            )}
            {status === "annulé" ? (
              <button
                type="button"
                onClick={() => {
                  setStatus("à venir");
                  flash("Rendez-vous rétabli — cliente prévenue par email.");
                }}
                className={`${inertBtn} cursor-pointer bg-brand-500 text-white hover:bg-brand-600`}
              >
                Rétablir le rendez-vous
              </button>
            ) : (
              !meta.closed && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("annulé");
                    flash("Rendez-vous annulé — cliente prévenue par email.");
                  }}
                  className={`${inertBtn} cursor-pointer border border-error-200 text-error-600 hover:bg-error-50`}
                >
                  Annuler le rendez-vous
                </button>
              )
            )}
            {confirmDelete ? (
              <span className="ml-auto flex items-center gap-2 text-theme-xs">
                <span className="text-gray-500">
                  Supprimer définitivement ? Aucun email ne sera envoyé.
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/rendez-vous")}
                  className="font-semibold text-error-600 hover:underline"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="font-medium text-gray-500 hover:underline"
                >
                  Annuler
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${inertBtn} ml-auto cursor-pointer text-error-600 hover:bg-error-50`}
              >
                Supprimer définitivement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
