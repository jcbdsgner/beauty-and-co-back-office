"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import ClientDetailActions from "@/components/back-office/ClientDetailActions";
import DetailModal from "@/components/back-office/detail/DetailModal";
import DetailIdentityHeader, {
  DetailAvatar,
} from "@/components/back-office/detail/DetailIdentityHeader";
import StatTile from "@/components/back-office/detail/StatTile";
import Badge from "@/components/ui/badge/Badge";
import {
  clientNoun,
  fcfa,
  frLongDate,
  frShortDate,
  genderLabel,
  groupThousands,
  PREFERENCE_GROUPS,
  type ClientDetail,
  type ClientVisit,
} from "@/lib/mock/beautyandco";
import {
  ABONNEMENT_STATUS_META,
  abonnementSeeds,
  abonnementStatus,
  computeNextDueDate,
  forfaitById,
  packById,
  packPurchaseSeeds,
  packRemainingIds,
} from "@/lib/mock/abonnements";

// Fiche cliente — présentée en modal centré (inspiré d'un gabarit « fiche
// employé » : bandeau identité + grille d'infos, cartes de résumé, tableau).
// Même contenu que l'ancienne page dédiée, seul l'habillage change.
// closeMode "back" : ouverte par navigation depuis une autre page de l'admin
// (route interceptée) → referme sur l'écran d'origine. "list" : accès direct
// (URL tapée, rechargement) → referme vers /clients.

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const upcomingColumns: Column<ClientVisit>[] = [
  { key: "date", header: "Date", render: (v) => frShortDate(v.date) },
  { key: "service", header: "Prestation" },
  { key: "staff", header: "Praticienne" },
];

const historyColumns: Column<ClientVisit>[] = [
  { key: "date", header: "Date", render: (v) => frShortDate(v.date) },
  { key: "service", header: "Prestation" },
  { key: "staff", header: "Praticienne" },
  {
    key: "status",
    header: "Statut",
    render: (v) =>
      v.status === "annulé" ? (
        <Badge size="sm" color="error">
          Annulé
        </Badge>
      ) : (
        <Badge size="sm" color="success">
          Honoré
        </Badge>
      ),
  },
  {
    key: "amount",
    header: "Montant",
    align: "right",
    render: (v) => (v.status === "honoré" ? fcfa(v.amount) : "—"),
  },
];

function Legend({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label} <span className="font-medium text-gray-800">{n}</span>
    </span>
  );
}

export default function ClientDetailModal({
  detail,
  closeMode,
}: {
  detail: ClientDetail;
  closeMode: "back" | "list";
}) {
  const router = useRouter();
  const close = () => (closeMode === "back" ? router.back() : router.push("/clients"));

  const { row, preferences, stats, upcoming, history } = detail;
  const noun = clientNoun(row.gender);
  const clientAbonnements = abonnementSeeds.filter((a) => a.clientId === row.id);
  const clientPacks = packPurchaseSeeds.filter((p) => p.clientId === row.id);
  const hasSubscriptions = clientAbonnements.length > 0 || clientPacks.length > 0;
  const hasPreferences = PREFERENCE_GROUPS.some((g) => preferences[g.key].length > 0);

  return (
    <DetailModal title="Fiche cliente" onClose={close} widthClassName="max-w-4xl">
      <div className="space-y-6">
        <div className="flex justify-end">
          <ClientDetailActions clientName={row.name} noun={noun} />
        </div>

        <DetailIdentityHeader
          avatar={<DetailAvatar>{initials(row.name)}</DetailAvatar>}
          name={row.name}
          subtitle={
            <a href={`mailto:${row.email}`} className="text-brand-500 hover:text-brand-600">
              {row.email}
            </a>
          }
          badges={
            <>
              <Badge size="sm" color="light">
                {stats.total} rendez-vous
              </Badge>
              <Badge size="sm" color="light">
                {row.salonLabel}
              </Badge>
            </>
          }
          fields={[
            { label: "Genre", value: genderLabel(row.gender) },
            { label: "Téléphone", value: <span className="tabular-nums">{row.phone}</span> },
            { label: "Adresse", value: row.address },
            { label: "Membre depuis", value: frLongDate(row.since) },
          ]}
        />

        <section className="space-y-3">
          <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Résumé
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Total rendez-vous" value={String(stats.total)} />
            <StatTile label="Total dépensé" value={fcfa(row.totalSpent)} />
            <StatTile label="Points de fidélité" value={groupThousands(row.loyaltyPoints)} />
            <StatTile
              label="Dernière visite"
              value={row.lastVisit ? frShortDate(row.lastVisit) : "Jamais venue"}
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Répartition par statut
            </p>
            {stats.total === 0 ? (
              <p className="text-theme-sm text-gray-500">Aucun rendez-vous enregistré.</p>
            ) : (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                  {stats.honoured > 0 && (
                    <div
                      className="bg-success-500"
                      style={{ width: `${(stats.honoured / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.upcoming > 0 && (
                    <div
                      className="bg-warning-500"
                      style={{ width: `${(stats.upcoming / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.cancelled > 0 && (
                    <div
                      className="bg-error-500"
                      style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-theme-sm text-gray-600">
                  <Legend color="bg-success-500" label="Honorés" n={stats.honoured} />
                  <Legend color="bg-warning-500" label="À venir" n={stats.upcoming} />
                  <Legend color="bg-error-500" label="Annulés" n={stats.cancelled} />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Préférences
          </p>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            {hasPreferences ? (
              <div className="space-y-4">
                {PREFERENCE_GROUPS.filter((g) => preferences[g.key].length > 0).map((g) => (
                  <div key={g.key}>
                    <p className="mb-2 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                      {g.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {preferences[g.key].map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-theme-xs text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-sm text-gray-500">Aucune préférence enregistrée.</p>
            )}
          </div>
        </section>

        <section id="abonnements" className="scroll-mt-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
              Abonnements &amp; packs
            </p>
            <Link href="/fidelite" className="text-theme-sm text-brand-500 hover:text-brand-600">
              Gérer
            </Link>
          </div>
          {hasSubscriptions ? (
            <ul className="space-y-2">
              {clientAbonnements.map((ab) => {
                const forfait = forfaitById(ab.forfaitId);
                if (!forfait) return null;
                const meta = ABONNEMENT_STATUS_META[abonnementStatus(ab, forfait.cycleDays)];
                return (
                  <li
                    key={ab.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-theme-sm font-medium text-gray-800">
                      {forfait.label}
                      <Badge size="sm" color={meta.tone}>
                        {meta.label}
                      </Badge>
                    </span>
                    <span className="text-theme-xs text-gray-500">
                      {ab.revokedAt
                        ? `Révoqué le ${frLongDate(ab.revokedAt)}`
                        : `Prochaine échéance le ${frLongDate(
                            computeNextDueDate(ab, forfait.cycleDays),
                          )}`}
                    </span>
                  </li>
                );
              })}
              {clientPacks.map((pu) => {
                const pack = packById(pu.packId);
                if (!pack) return null;
                const remaining = packRemainingIds(pu, pack).length;
                const total = pack.prestationIds.length;
                return (
                  <li
                    key={pu.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-theme-sm font-medium text-gray-800">
                      {pack.label}
                      {remaining === 0 && (
                        <Badge size="sm" color="light">
                          Entièrement utilisé
                        </Badge>
                      )}
                    </span>
                    <span className="text-theme-xs text-gray-500">
                      {remaining} / {total} prestation{total > 1 ? "s" : ""} restante
                      {remaining > 1 ? "s" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-theme-sm text-gray-500">
              Aucun abonnement ni pack.
            </p>
          )}
        </section>

        <section id="rendez-vous" className="scroll-mt-4 space-y-3">
          <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Rendez-vous à venir
          </p>
          <DataTable
            columns={upcomingColumns}
            rows={upcoming}
            rowKey={(v) => `${v.date}-${v.service}`}
            empty="Aucun rendez-vous à venir."
          />
        </section>

        <section id="historique" className="scroll-mt-4 space-y-3">
          <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Historique des visites
          </p>
          <DataTable
            columns={historyColumns}
            rows={history}
            rowKey={(v) => `${v.date}-${v.service}`}
            empty="Aucune visite enregistrée."
          />
        </section>
      </div>
    </DetailModal>
  );
}
