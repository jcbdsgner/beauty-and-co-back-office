"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import ClientDetailActions from "@/components/back-office/ClientDetailActions";
import DetailModal from "@/components/back-office/detail/DetailModal";
import { EditCoordonneesDialog, EditPreferencesDialog } from "@/components/back-office/ClientEditDialogs";
import Badge from "@/components/ui/badge/Badge";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChatIcon,
  DollarLineIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  ShootingStarIcon,
} from "@/icons";
import {
  clientNoun,
  fcfa,
  frLongDate,
  frShortDate,
  genderLabel,
  groupThousands,
  PREFERENCE_GROUPS,
  type ClientDetail,
  type ClientSegment,
  type ClientVisit,
} from "@/lib/mock/beautyandco";
import { useClientsData } from "@/context/ClientsContext";
import { defaultTiers } from "@/lib/mock/fidelite";
import { conversationByClientId } from "@/lib/mock/messagerie";
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
  type Abonnement,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import { getForfaitPrestations, type Forfait } from "@/lib/mock/forfaits";
import { getPackPrestations, type Pack } from "@/lib/mock/packs";
import { advantageLabel, allRendezvous } from "@/lib/mock/rendezvous";

// Fiche cliente — présentée en panneau latéral droit (chrome partagé
// `detail/DetailModal`). Refonte 2026-09-21 (demande explicite de
// l'utilisatrice, skills design-critique + frontend-design) puis
// réorganisation 2026-09-21 (deuxième demande explicite, skill impeccable) sur
// le calque d'une référence fournie (fiche patient à deux colonnes) :
// colonne gauche = identité (héros + informations + préférences), colonne
// droite = ce qui se mesure (KPI, avantages en cours, rendez-vous). Aucune
// info/stat retirée par rapport à la version précédente — seulement
// redisposée. Le contenu n'utilise ni `detail/DetailIdentityHeader` ni
// `detail/StatTile` (toujours utilisés par RendezVousDetail / StockDetail,
// inchangés) : la composition héros ne rentre pas dans ce gabarit générique.
//
// « Avantages en cours » (ex-« Abonnements & packs ») reprend le
// vocabulaire de la référence (« Test Reports ») : des cartes cliquables plutôt
// qu'une liste, une carte par avantage actif (abonnement, pack, **et carte
// cadeau** — retrouvée en scannant les rendez-vous de la cliente,
// `@/lib/mock/rendezvous`, aucune autre fixture ne la rattache à une cliente).
// Chaque carte ouvre une petite fenêtre modale de détail (prestations
// incluses/consommées, échéance…) — même résolution que `AdvantageItem` dans
// `RendezVousDetail.tsx`, présentée ici en fenêtre plutôt qu'en ligne.
//
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

const SEGMENT_META: Record<ClientSegment, { label: string; color: "primary" | "light" | "warning" }> = {
  active: { label: "Cliente régulière", color: "primary" },
  occasionnelle: { label: "Occasionnelle", color: "light" },
  "a-relancer": { label: "À relancer", color: "warning" },
};

// Palier de fidélité atteint par la cliente — dérivé de ses points face aux
// seuils réglés dans `/fidelite` (`defaultTiers`). Absent jusqu'ici : le
// programme de fidélité et la fiche cliente ne se croisaient jamais (audit de
// parité point-de-vente 2026-09-22, où `Cliente.tier` est affiché en badge).
// Lit les seuils par défaut, pas l'état de session édité sur `/fidelite` —
// simplification assumée (pas de state partagé entre les deux écrans).
function loyaltyTierOf(points: number) {
  return [...defaultTiers].sort((a, b) => b.minPoints - a.minPoints).find((t) => points >= t.minPoints);
}

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

/* --- avantages : abonnement + pack + carte cadeau, une seule liste ----- */

type ClientAdvantage =
  | { id: string; kind: "abonnement"; ab: Abonnement; forfait: Forfait }
  | { id: string; kind: "pack"; purchase: PackPurchase; pack: Pack }
  | { id: string; kind: "carte-cadeau"; code: string; balance: number; ref: string };

function clientAdvantages(clientId: string): ClientAdvantage[] {
  const advantages: ClientAdvantage[] = [];

  for (const ab of abonnementSeeds) {
    if (ab.clientId !== clientId) continue;
    const forfait = forfaitById(ab.forfaitId);
    if (forfait) advantages.push({ id: ab.id, kind: "abonnement", ab, forfait });
  }

  for (const pu of packPurchaseSeeds) {
    if (pu.clientId !== clientId) continue;
    const pack = packById(pu.packId);
    if (pack) advantages.push({ id: pu.id, kind: "pack", purchase: pu, pack });
  }

  // La carte cadeau n'est rattachée à aucune fixture « cliente » directe :
  // elle vit sur le rendez-vous qui l'a mobilisée (`RdvAdvantage`).
  for (const r of allRendezvous()) {
    if (r.client.id !== clientId) continue;
    for (const a of r.advantages) {
      if (a.kind === "carte-cadeau") {
        advantages.push({ id: `${r.id}-${a.code}`, kind: "carte-cadeau", code: a.code, balance: a.balance, ref: r.ref });
      }
    }
  }

  return advantages;
}

const cardClass =
  "flex w-52 shrink-0 flex-col items-start gap-2.5 rounded-2xl border border-gray-100 bg-white p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";
const iconWrapClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 [&_svg]:h-5 [&_svg]:w-5";

function AdvantageCard({ advantage, onOpen }: { advantage: ClientAdvantage; onOpen: () => void }) {
  if (advantage.kind === "abonnement") {
    const meta = ABONNEMENT_STATUS_META[abonnementStatus(advantage.ab, advantage.forfait.cycleDays)];
    return (
      <button type="button" onClick={onOpen} className={cardClass}>
        <span className={iconWrapClass}>
          <ShootingStarIcon />
        </span>
        <div className="w-full min-w-0">
          <p className="line-clamp-2 text-theme-sm font-medium text-gray-800">{advantage.forfait.label}</p>
          <div className="mt-1.5">
            <Badge size="sm" color={meta.tone}>
              {meta.label}
            </Badge>
          </div>
          <p className="mt-1.5 text-theme-xs text-gray-500">{advantageLabel.abonnement}</p>
        </div>
      </button>
    );
  }

  if (advantage.kind === "pack") {
    const remaining = packRemainingIds(advantage.purchase, advantage.pack).length;
    const total = advantage.pack.prestationIds.length;
    return (
      <button type="button" onClick={onOpen} className={cardClass}>
        <span className={iconWrapClass}>
          <BoxCubeIcon />
        </span>
        <div className="w-full min-w-0">
          <p className="line-clamp-2 text-theme-sm font-medium text-gray-800">{advantage.pack.label}</p>
          <p className="mt-1.5 text-theme-xs text-gray-500">
            {remaining} / {total} prestation{total > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={onOpen} className={cardClass}>
      <span className={iconWrapClass}>
        <DollarLineIcon />
      </span>
      <div className="w-full min-w-0">
        <p className="text-theme-sm font-medium text-gray-800">{advantageLabel["carte-cadeau"]}</p>
        <p className="mt-1.5 text-theme-xs text-gray-500">{groupThousands(advantage.balance)} FCFA disponibles</p>
      </div>
    </button>
  );
}

// Fenêtre de détail d'un avantage — ce qui est inclus / déjà consommé. Ancrée
// dans le panneau (le panneau glissant porte un `transform`, qui devient le
// conteneur de tout `position: fixed` descendant) : le fond assombri ne
// couvre que la fiche, pas l'écran entier derrière elle.
function AdvantageDetailOverlay({ advantage, onClose }: { advantage: ClientAdvantage; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-theme-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={iconWrapClass}>
              {advantage.kind === "abonnement" ? (
                <ShootingStarIcon />
              ) : advantage.kind === "pack" ? (
                <BoxCubeIcon />
              ) : (
                <DollarLineIcon />
              )}
            </span>
            <div>
              <p className="text-theme-sm font-bold text-gray-900">
                {advantage.kind === "abonnement"
                  ? advantage.forfait.label
                  : advantage.kind === "pack"
                    ? advantage.pack.label
                    : advantageLabel["carte-cadeau"]}
              </p>
              <p className="text-theme-xs text-gray-500">
                {advantage.kind === "abonnement"
                  ? `${advantageLabel.abonnement} · ${advantage.forfait.cycleLabel.toLowerCase()}`
                  : advantage.kind === "pack"
                    ? advantageLabel.pack
                    : `Code ${advantage.code}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {advantage.kind === "abonnement" && (() => {
          const { ab, forfait } = advantage;
          const status = abonnementStatus(ab, forfait.cycleDays);
          const meta = ABONNEMENT_STATUS_META[status];
          const resolved = getForfaitPrestations(forfait);
          const availableIds = availablePrestationIds(forfait.prestationIds, ab.redeemedPrestationIds);
          return (
            <>
              <div className="mt-4">
                <Badge size="sm" color={meta.tone}>
                  {meta.label}
                </Badge>
              </div>
              <p className="mt-4 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Prestations incluses chaque cycle
              </p>
              <ul className="mt-2 space-y-1.5">
                {resolved.map((p) => {
                  const available = availableIds.includes(p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-theme-sm text-gray-700">
                      <span>{p.label}</span>
                      <span className={`shrink-0 text-theme-xs ${available && status === "current" ? "text-success-600" : "text-gray-400"}`}>
                        {status !== "current" ? "—" : available ? "Disponible" : "Déjà consommée"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-theme-xs text-gray-500">
                {ab.revokedAt
                  ? `Révoqué le ${frLongDate(ab.revokedAt)}`
                  : `Prochaine échéance le ${frLongDate(computeNextDueDate(ab, forfait.cycleDays))}`}
              </p>
              <p className="mt-1 text-theme-xs text-gray-400">Souscrit le {frLongDate(ab.subscribedAt)}</p>
            </>
          );
        })()}

        {advantage.kind === "pack" && (() => {
          const { purchase, pack } = advantage;
          const resolved = getPackPrestations(pack);
          const remainingIds = packRemainingIds(purchase, pack);
          const remaining = remainingIds.length;
          const total = resolved.length;
          const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
          return (
            <>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-theme-xs font-medium tabular-nums text-gray-600">
                  {remaining} / {total} restante{remaining > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-4 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Prestations du pack
              </p>
              <ul className="mt-2 space-y-1.5">
                {resolved.map((p) => {
                  const remains = remainingIds.includes(p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-theme-sm">
                      <span className={remains ? "text-gray-700" : "text-gray-400 line-through"}>{p.label}</span>
                      <span className="shrink-0 text-theme-xs text-gray-500">{fcfa(p.priceFcfa)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-theme-xs text-gray-400">Acheté le {frLongDate(purchase.purchasedAt)}</p>
            </>
          );
        })()}

        {advantage.kind === "carte-cadeau" && (
          <>
            <p className="mt-4 text-theme-sm text-gray-500">Solde disponible</p>
            <p className="text-title-sm font-bold tabular-nums text-gray-900">
              {groupThousands(advantage.balance)} <span className="text-base font-semibold text-gray-400">FCFA</span>
            </p>
            <p className="mt-4 text-theme-xs text-gray-400">
              Mobilisée lors du rendez-vous {advantage.ref}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* --- primitives locales ------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <span className={iconWrapClass}>{icon}</span>
      <p className="mt-3 text-theme-xs text-gray-500">{label}</p>
      <p className="mt-1 truncate text-theme-lg font-bold leading-none text-gray-900">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-theme-xs text-gray-400">{label}</p>
      {href ? (
        <a
          href={href}
          className="mt-0.5 block break-words text-theme-sm font-medium text-brand-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-0.5 break-words text-theme-sm font-medium text-gray-700">{value}</p>
      )}
    </div>
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
  const [openAdvantage, setOpenAdvantage] = useState<ClientAdvantage | null>(null);
  const [editingCoordonnees, setEditingCoordonnees] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const { updateCoordonnees, updatePreferences, addNote, notesFor } = useClientsData();

  const { row, preferences, stats, upcoming, history } = detail;
  const noun = clientNoun(row.gender);
  const segment = SEGMENT_META[row.segment];
  const tier = loyaltyTierOf(row.loyaltyPoints);
  const advantages = clientAdvantages(row.id);
  const hasPreferences = PREFERENCE_GROUPS.some((g) => preferences[g.key].length > 0);
  const notes = notesFor(row.id);
  const conversation = conversationByClientId(row.id);

  return (
    <DetailModal title="Fiche cliente" onClose={close} widthClassName="max-w-5xl">
      <div className="grid grid-cols-[300px_1fr] gap-8">
        {/* --- Colonne gauche : identité --- */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-4 ring-white">
              {initials(row.name)}
            </span>
            <h2 className="mt-4 text-title-sm font-bold text-gray-900">{row.name}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Badge size="sm" color={segment.color}>
                {segment.label}
              </Badge>
              {tier && (
                <Badge size="sm" color="light">
                  Palier {tier.name}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-theme-xs text-gray-500">
              {noun === "client" ? "Client" : "Cliente"} depuis {frLongDate(row.since)}
            </p>

            <Link
              href="/rendez-vous?nouveau=1"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" />
              Nouveau rendez-vous
            </Link>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-brand-100 pt-4">
              <a href="#historique" className="text-theme-xs font-medium text-gray-500 hover:text-gray-700">
                Historique complet
              </a>
              {conversation && (
                <>
                  <span className="text-gray-200">·</span>
                  <Link
                    href={`/messagerie?client=${row.id}`}
                    className="inline-flex items-center gap-1 text-theme-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <ChatIcon className="size-3.5" />
                    Voir les échanges
                  </Link>
                </>
              )}
              <span className="text-gray-200">·</span>
              <ClientDetailActions clientName={row.name} noun={noun} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <SectionLabel>Informations</SectionLabel>
              <button
                type="button"
                onClick={() => setEditingCoordonnees(true)}
                className="inline-flex items-center gap-1 text-theme-xs font-medium text-gray-400 hover:text-brand-600"
              >
                <PencilIcon className="size-3.5" />
                Modifier
              </button>
            </div>
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
              <InfoRow label="Genre" value={genderLabel(row.gender)} />
              <InfoRow label="Adresse" value={row.address} />
              <InfoRow label="Salon" value={row.salonLabel} />
              <InfoRow label="Email" value={row.email} href={row.email ? `mailto:${row.email}` : undefined} />
              <InfoRow label="Téléphone" value={row.phone} href={row.phone ? `tel:${row.phone.replace(/\s+/g, "")}` : undefined} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <SectionLabel>Préférences</SectionLabel>
              <button
                type="button"
                onClick={() => setEditingPreferences(true)}
                className="inline-flex items-center gap-1 text-theme-xs font-medium text-gray-400 hover:text-brand-600"
              >
                <PencilIcon className="size-3.5" />
                Modifier
              </button>
            </div>
            {hasPreferences ? (
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                {PREFERENCE_GROUPS.filter((g) => preferences[g.key].length > 0).map((g) => (
                  <div key={g.key} className="px-4 py-3">
                    <p className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                      {g.label}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences[g.key].map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs text-brand-700"
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
          </section>

          <section className="space-y-3">
            <SectionLabel>Notes internes</SectionLabel>
            <div className="space-y-2">
              <textarea
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Observation, préférence exprimée en salon…"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
              />
              <button
                type="button"
                onClick={() => {
                  if (!noteDraft.trim()) return;
                  addNote(row.id, noteDraft);
                  setNoteDraft("");
                }}
                disabled={!noteDraft.trim()}
                className="text-theme-xs font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Ajouter la note
              </button>
            </div>
            {notes.length > 0 && (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5">
                    <p className="text-theme-sm text-gray-700">{n.text}</p>
                    <p className="mt-1 text-theme-xs text-gray-400">{frLongDate(n.at.slice(0, 10))}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <EditCoordonneesDialog
          open={editingCoordonnees}
          initial={{ phone: row.phone, email: row.email, address: row.address }}
          onClose={() => setEditingCoordonnees(false)}
          onSave={(patch) => updateCoordonnees(row.id, patch)}
        />
        <EditPreferencesDialog
          open={editingPreferences}
          initial={preferences}
          onClose={() => setEditingPreferences(false)}
          onSave={(group, items) => updatePreferences(row.id, group, items)}
        />

        {/* --- Colonne droite : ce qui se mesure --- */}
        <div className="min-w-0 space-y-8">
          <section className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<CalenderIcon />}
              label="Dernière visite"
              value={row.lastVisit ? frShortDate(row.lastVisit) : "Jamais venue"}
            />
            <StatCard icon={<DollarLineIcon />} label="Total dépensé" value={fcfa(row.totalSpent)} />
            <StatCard icon={<ListIcon />} label="Rendez-vous" value={String(stats.total)} />
            <StatCard
              icon={<ShootingStarIcon />}
              label="Points de fidélité"
              value={groupThousands(row.loyaltyPoints)}
            />
          </section>

          {/* Répartition par statut : bande fine, pas une carte à part */}
          {stats.total > 0 && (
            <section className="flex flex-wrap items-center gap-4">
              <div className="h-2 flex-1 min-w-40 overflow-hidden rounded-full bg-gray-100">
                {stats.honoured > 0 && (
                  <div
                    className="h-full float-left bg-success-500"
                    style={{ width: `${(stats.honoured / stats.total) * 100}%` }}
                  />
                )}
                {stats.upcoming > 0 && (
                  <div
                    className="h-full float-left bg-blue-light-500"
                    style={{ width: `${(stats.upcoming / stats.total) * 100}%` }}
                  />
                )}
                {stats.cancelled > 0 && (
                  <div
                    className="h-full float-left bg-error-500"
                    style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-theme-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-500" />
                  Honorés <span className="font-semibold text-gray-700">{stats.honoured}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-light-500" />
                  À venir <span className="font-semibold text-gray-700">{stats.upcoming}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-error-500" />
                  Annulés <span className="font-semibold text-gray-700">{stats.cancelled}</span>
                </span>
              </div>
            </section>
          )}

          {/* Avantages en cours : abonnement / pack / carte cadeau, cliquables */}
          <section id="abonnements" className="scroll-mt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <SectionLabel>Avantages en cours</SectionLabel>
              <Link href="/fidelite" className="text-theme-sm text-brand-500 hover:text-brand-600">
                Gérer
              </Link>
            </div>
            {advantages.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {advantages.map((a) => (
                  <AdvantageCard key={a.id} advantage={a} onOpen={() => setOpenAdvantage(a)} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-theme-sm text-gray-500">
                Aucun avantage en cours.
              </p>
            )}
          </section>

          {/* Rendez-vous à venir */}
          <section id="rendez-vous" className="scroll-mt-4 space-y-3">
            <SectionLabel>Rendez-vous à venir</SectionLabel>
            <DataTable
              columns={upcomingColumns}
              rows={upcoming}
              rowKey={(v) => `${v.date}-${v.service}`}
              empty="Aucun rendez-vous à venir."
            />
          </section>

          {/* Historique */}
          <section id="historique" className="scroll-mt-4 space-y-3">
            <SectionLabel>Historique des visites</SectionLabel>
            <DataTable
              columns={historyColumns}
              rows={history}
              rowKey={(v) => `${v.date}-${v.service}`}
              empty="Aucune visite enregistrée."
            />
          </section>
        </div>
      </div>

      {openAdvantage && (
        <AdvantageDetailOverlay advantage={openAdvantage} onClose={() => setOpenAdvantage(null)} />
      )}
    </DetailModal>
  );
}
