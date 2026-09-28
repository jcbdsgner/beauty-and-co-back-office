"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Cake,
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Phone,
  Printer,
  Sparkles,
  Users,
} from "lucide-react";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import ClientDetailActions from "@/components/back-office/ClientDetailActions";
import DetailModal from "@/components/back-office/detail/DetailModal";
import { EditCoordonneesDialog, EditPreferencesDialog } from "@/components/back-office/ClientEditDialogs";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Select } from "@/components/ui/atoms/select";
import { Textarea } from "@/components/ui/atoms/textarea";
import Badge2 from "@/components/ui/badge/Badge";
import { cn } from "@/lib/utils";
import {
  ETHNICITY_LABEL,
  TIER_LABEL,
  clientNoun,
  clientNumberLabel,
  fcfa,
  formatBirthday,
  frLongDate,
  frShortDate,
  type ClientDetail,
  type ClientRow,
  type ClientVisit,
} from "@/lib/mock/beautyandco";
import {
  PREFERENCE_DOMAINS,
  PREFERENCE_DOMAIN_LABEL,
  notationTally,
  takenOptions,
  type ClientPreferences,
  type PreferenceDomain,
  type PreferenceQuestion,
} from "@/lib/mock/preferences";
import { fullName, memberById, members, initials as staffInitials } from "@/lib/mock/staff";
import { conversationByClientId, type Conversation } from "@/lib/mock/messagerie";
import { ABONNEMENT_STATUS_META, forfaitById, packById } from "@/lib/mock/abonnements";
import { useClientsData, type ClientNote } from "@/context/ClientsContext";
import { usePreferenceConfig } from "@/context/PreferencesContext";
import { useAccount } from "@/context/AccountContext";
import { initialsOf } from "./shared/PersonCard";
import { Board, BoardEmpty, Legend } from "./shared/board";
import {
  AbonnementsPacksBoard,
  clientAbonnements,
  clientPacks,
  packRemaining,
  statusOf,
  statusTextClass,
} from "./shared/ClientAdvantages";

// Fiche cliente — présentée en panneau latéral droit (`detail/DetailModal`,
// conservé), mais sa disposition et ses détails sont ceux de la fiche de
// point-de-vente, qui fait autorité (`components/clientele/fiche-cliente-view.tsx`,
// 2026-09-28) : bandeau d'identité collant (avatar, nom, palier, n° client,
// « cliente depuis · dernière visite », Contacter + action principale) et sa
// ligne « en un coup d'œil » (abonnement, pack, points, visites, total
// dépensé) ; puis deux colonnes — à gauche ce qui sert au passage
// (préférences, abonnements & packs, notes internes signées), à droite la
// référence (coordonnées, carte de fidélité, échanges).
//
// Écarts back-office : l'action principale est « Nouveau rendez-vous » (pas
// de caisse ici, donc pas de « Nouvelle vente ») ; les rendez-vous (à venir
// et historique récent, lus dans les vraies réservations) sous les deux
// colonnes — la propriétaire pilote, la caisse n'en a pas besoin.
//
// closeMode "back" : ouverte depuis l'admin (route interceptée) → referme sur
// l'écran d'origine. "list" : accès direct → referme vers /clients.

const OWNER_ID = "owner";

/* --- en un coup d'œil ------------------------------------------------ */

function Fact({
  icon,
  label,
  grow,
  figure,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  grow?: boolean;
  figure?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3 px-4 py-3", grow ? "flex-1" : "shrink-0")}>
      {icon && <span className="shrink-0 text-secondary">{icon}</span>}
      <div className="min-w-0">
        <dt className="text-xs font-medium text-base-content/55">{label}</dt>
        <dd className={cn("truncate text-base-content", figure ? "text-lg font-semibold tabular-nums" : "text-[15px] font-medium")}>
          {children}
        </dd>
      </div>
    </div>
  );
}

function AtAGlance({ row }: { row: ClientRow }) {
  const activeAbos = clientAbonnements(row.id).filter((ab) => statusOf(ab) !== "revoked");
  const openPacks = clientPacks(row.id).filter((pp) => packRemaining(pp).length > 0);
  const packsLeft = openPacks.reduce((sum, pp) => sum + packRemaining(pp).length, 0);

  return (
    <dl className="-mx-6 mt-4 flex divide-x divide-base-300 border-t border-base-300 px-2">
      <Fact icon={<CalendarClock className="size-5" />} label="Abonnement" grow>
        {activeAbos.length === 0 ? (
          <span className="text-base-content/50">Aucun</span>
        ) : (
          activeAbos.map((ab, i) => {
            const status = statusOf(ab);
            return (
              <span key={ab.id}>
                {i > 0 && ", "}
                {forfaitById(ab.forfaitId)?.label}{" "}
                <span className={cn("font-semibold", statusTextClass(status))}>· {ABONNEMENT_STATUS_META[status].label}</span>
              </span>
            );
          })
        )}
      </Fact>
      <Fact icon={<PackageCheck className="size-5" />} label="Pack" grow>
        {openPacks.length === 0 ? (
          <span className="text-base-content/50">Aucun</span>
        ) : (
          <>
            {openPacks.map((pp) => packById(pp.packId)?.label).join(", ")}{" "}
            <span className="font-semibold text-success">
              · {packsLeft} prestation{packsLeft > 1 ? "s" : ""} restante{packsLeft > 1 ? "s" : ""}
            </span>
          </>
        )}
      </Fact>
      <Fact label="Points fidélité" figure>
        {row.loyaltyPoints}
      </Fact>
      <Fact label="Visites" figure>
        {row.appointments}
      </Fact>
      <Fact label="Total dépensé" figure>
        {fcfa(row.totalSpent)}
      </Fact>
    </dl>
  );
}

/* --- préférences ----------------------------------------------------- */

function PreferencesBoard({
  prefs,
  questions,
  onEdit,
}: {
  prefs: ClientPreferences;
  questions: PreferenceQuestion[];
  onEdit: () => void;
}) {
  const domains = PREFERENCE_DOMAINS.filter((d) => prefs.notes[d] || notationTally(prefs, d, questions).length > 0);
  const hasBasics = Boolean(prefs.hairType || prefs.colorReference);

  return (
    <Board
      legend="Préférences"
      legendRight={
        <Button variant="outline" size="sm" icon={<Pencil className="size-4" />} onClick={onEdit}>
          Modifier
        </Button>
      }
    >
      {!hasBasics && domains.length === 0 ? (
        <BoardEmpty title="Aucune préférence notée" hint="Elles se remplissent à chaque encaissement, ou depuis « Modifier »." />
      ) : (
        <div className="flex flex-col divide-y divide-base-300">
          {hasBasics && (
            <div className="grid grid-cols-2 gap-4 px-5 py-4">
              <Pref label="Type de cheveux" value={prefs.hairType} />
              <Pref label="Référence couleur" value={prefs.colorReference} />
            </div>
          )}
          {domains.map((domain) => (
            <PreferenceDomainRow key={domain} prefs={prefs} domain={domain} questions={questions} />
          ))}
        </div>
      )}
    </Board>
  );
}

function PreferenceDomainRow({
  prefs,
  domain,
  questions,
}: {
  prefs: ClientPreferences;
  domain: PreferenceDomain;
  questions: PreferenceQuestion[];
}) {
  const note = prefs.notes[domain];
  const tallies = notationTally(prefs, domain, questions);
  const passages = prefs.rounds.filter((r) => tallies.some((t) => (r.choices[t.question.id]?.length ?? 0) > 0)).length;
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-5 px-5 py-4">
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-base-content">{PREFERENCE_DOMAIN_LABEL[domain]}</p>
        {passages > 0 && <p className="mt-0.5 text-xs tabular-nums text-base-content/55">Notée {passages} fois</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {tallies.map((tally) => (
          <div key={tally.question.id} className="flex items-start gap-3">
            <p className="w-[4.5rem] shrink-0 pt-3.5 text-xs font-medium text-base-content/55">{tally.question.noteLabel}</p>
            <ul className="flex min-w-0 flex-wrap gap-2">
              {takenOptions(tally).map(({ option, count, latest }) => (
                <li
                  key={option.id}
                  className={cn(
                    "flex h-12 items-center gap-2.5 rounded-field border bg-base-100 pr-3",
                    option.photo ? "pl-1" : "pl-3",
                    latest ? "highlight-rose" : "border-base-300",
                  )}
                >
                  {option.photo && (
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-[calc(var(--radius-field)-4px)] bg-accent">
                      {/* eslint-disable-next-line @next/next/no-img-element -- photo locale ou dataURL de session */}
                      <img src={option.photo} alt="" className="size-full object-cover" />
                    </span>
                  )}
                  <span className="flex flex-col leading-tight">
                    <span className="text-[15px] font-medium text-base-content">{option.label}</span>
                    {latest && <span className="text-[11px] font-semibold text-secondary">Dernière fois</span>}
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums text-base-content/50" aria-label={`${count} fois`}>
                    ×{count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {note && <p className="whitespace-pre-line text-[15px] leading-relaxed text-base-content/90">{note}</p>}
      </div>
    </div>
  );
}

function Pref({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-base-content/55">{label}</p>
      <p className={cn("mt-0.5 text-[15px]", value ? "text-base-content" : "text-base-content/45")}>{value ?? "Non renseigné"}</p>
    </div>
  );
}

/* --- notes internes -------------------------------------------------- */

const NOTE_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const NOTE_TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function NotesBoard({ clientId }: { clientId: string }) {
  const { notesFor, addNote } = useClientsData();
  const { account } = useAccount();
  const [draft, setDraft] = useState("");
  const [authorId, setAuthorId] = useState(OWNER_ID);
  const notes = notesFor(clientId);

  const authorOptions = [
    { value: OWNER_ID, label: `Par ${account.name}` },
    ...members.filter((m) => m.active).map((m) => ({ value: m.id, label: `Par ${fullName(m)}` })),
  ];

  const add = () => {
    if (!draft.trim()) return;
    addNote(clientId, draft, authorId);
    setDraft("");
  };

  return (
    <Board
      legend="Notes internes"
      legendRight={
        notes.length > 0 && (
          <span className="text-sm text-base-content/55">
            {notes.length} note{notes.length > 1 ? "s" : ""}
          </span>
        )
      }
    >
      <div className="flex flex-col gap-3 border-b border-base-300 bg-black/[0.015] p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Une observation faite en salon…"
          rows={2}
          aria-label="Nouvelle note"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={authorId} onChange={setAuthorId} options={authorOptions} size="compact" className="w-auto min-w-[11rem]" />
          <Button variant="brand" size="sm" className="ml-auto min-w-28" onClick={add} disabled={!draft.trim()}>
            Ajouter
          </Button>
        </div>
      </div>
      {notes.length === 0 ? (
        <BoardEmpty title="Aucune note" hint="Les notes prises ici ou après un encaissement s'affichent ici, signées." />
      ) : (
        <ol className="flex flex-col divide-y divide-base-300">
          {notes.map((note) => (
            <NoteEntry key={note.id} note={note} ownerName={account.name} />
          ))}
        </ol>
      )}
    </Board>
  );
}

function NoteEntry({ note, ownerName }: { note: ClientNote; ownerName: string }) {
  const at = new Date(note.at);
  const member = note.authorId === OWNER_ID ? null : memberById(note.authorId);
  const author = member ? fullName(member) : note.authorId === OWNER_ID ? ownerName : "Équipe";
  const initial = member ? staffInitials(member) : initialsOf(author);
  return (
    <li className="flex gap-3 px-4 py-4">
      <Avatar initial={initial} size={40} className="bg-accent text-sm font-semibold text-secondary" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold text-base-content">{author}</span>
          <span className="tabular-nums text-base-content/55">
            {NOTE_DATE.format(at)} · {NOTE_TIME.format(at)}
          </span>
          {note.origin === "encaissement" && (
            <span className="rounded-md bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/65">Après encaissement</span>
          )}
        </p>
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-base-content/90">{note.text}</p>
      </div>
    </li>
  );
}

/* --- coordonnées, carte, échanges ------------------------------------ */

function Row({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-base-content/55">{label}</p>
        {value && href ? (
          <a href={href} className="block truncate text-[15px] text-base-content underline-offset-2 hover:underline">
            {value}
          </a>
        ) : (
          <p className={cn("truncate text-[15px]", value ? "text-base-content" : "text-base-content/45")}>{value || "Non renseigné"}</p>
        )}
      </div>
    </div>
  );
}

function CoordonneesBoard({ row, onEdit }: { row: ClientRow; onEdit: () => void }) {
  const preferred = row.preferredStaffId ? memberById(row.preferredStaffId) : null;
  const tel = (n: string) => `tel:${n.replace(/\s+/g, "")}`;
  return (
    <Board
      legend="Coordonnées"
      legendRight={
        <Button variant="outline" size="sm" icon={<Pencil className="size-4" />} onClick={onEdit} aria-label="Modifier les coordonnées">
          Modifier
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <Row icon={<Phone className="size-5" />} label="Téléphone" value={row.phone} href={tel(row.phone)} />
        <Row
          icon={<MessageCircle className="size-5" />}
          label="WhatsApp"
          value={row.whatsapp}
          href={row.whatsapp ? `https://wa.me/${row.whatsapp.replace(/\D/g, "")}` : undefined}
        />
        <Row icon={<Mail className="size-5" />} label="E-mail" value={row.email} href={`mailto:${row.email}`} />
        <Row icon={<Briefcase className="size-5" />} label="Profession" value={row.profession} />
        <Row icon={<MapPin className="size-5" />} label="Adresse" value={row.address} />
        <Row icon={<Globe className="size-5" />} label="Pays de résidence" value={row.residenceCountry} />
        <Row icon={<Cake className="size-5" />} label="Anniversaire" value={formatBirthday(row.birthday)} />
        <Row icon={<Users className="size-5" />} label="Ethnicité" value={ETHNICITY_LABEL[row.ethnicity]} />
        {preferred && (
          <Link href={`/equipe?membre=${preferred.id}`} className="flex items-center gap-3 rounded-field text-left">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-base-content/55">Praticienne préférée</span>
              <span className="flex items-center gap-1 text-[15px] font-medium text-primary underline underline-offset-2">
                {fullName(preferred)}
                <ChevronRight className="size-4" />
              </span>
            </span>
          </Link>
        )}
      </div>
    </Board>
  );
}

// Motif QR de démonstration, déterministe (même principe que `DemoQrBlock` de
// point-de-vente) — n'encode aucune donnée réelle.
function DemoQr({ seed, size = 76 }: { seed: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < 36; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >> 16) % 3 === 0);
  }
  return (
    <div aria-hidden className="grid grid-cols-6 gap-[2px] rounded-lg border border-base-300 bg-base-100 p-2" style={{ width: size, height: size }}>
      {cells.map((on, i) => (
        <span key={i} className={cn("rounded-[1px]", on ? "bg-primary" : "bg-transparent")} />
      ))}
    </div>
  );
}

function EchangesBoard({ firstName, conversation, clientId }: { firstName: string; conversation?: Conversation; clientId: string }) {
  const last = conversation
    ? conversation.events.filter((e) => e.kind === "message" && e.text).slice(-2)
    : [];
  return (
    <Board
      legend="Échanges"
      legendRight={
        last.length > 0 && (
          <Button variant="outline" size="sm" href={`/messagerie?client=${clientId}`}>
            Voir tout
          </Button>
        )
      }
    >
      {last.length === 0 ? (
        <BoardEmpty title="Aucun échange" hint="Rien n'a encore été envoyé à cette cliente." />
      ) : (
        <ul className="divide-y divide-base-300">
          {last.map((m) =>
            m.kind === "message" ? (
              <li key={m.id} className="px-4 py-3">
                <p className="text-[15px] font-semibold text-base-content">{m.direction === "in" ? firstName : "Vous"}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-base-content/60">{m.text}</p>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </Board>
  );
}

/* --- rendez-vous ----------------------------------------------------- */

const upcomingColumns: Column<ClientVisit>[] = [
  {
    key: "date",
    header: "Date",
    render: (v) =>
      v.rdvId ? (
        <Link href={`/rendez-vous/${v.rdvId}`} className="font-medium text-primary underline-offset-2 hover:underline">
          {frShortDate(v.date)}
          {v.time && ` · ${v.time}`}
        </Link>
      ) : (
        frShortDate(v.date)
      ),
  },
  { key: "service", header: "Prestations" },
  { key: "staff", header: "Praticienne" },
];

const historyColumns: Column<ClientVisit>[] = [
  upcomingColumns[0],
  { key: "service", header: "Prestation" },
  { key: "staff", header: "Praticienne" },
  {
    key: "status",
    header: "Statut",
    render: (v) =>
      v.status === "annulé" ? (
        <Badge2 size="sm" color="error">
          Annulé
        </Badge2>
      ) : (
        <Badge2 size="sm" color="success">
          Honoré
        </Badge2>
      ),
  },
  {
    key: "amount",
    header: "Montant",
    align: "right",
    render: (v) => (v.status === "honoré" ? fcfa(v.amount) : "—"),
  },
];

/* --- fiche ----------------------------------------------------------- */

const monthYear = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export default function ClientDetailModal({
  detail,
  closeMode,
}: {
  detail: ClientDetail;
  closeMode: "back" | "list";
}) {
  const router = useRouter();
  const close = () => (closeMode === "back" ? router.back() : router.push("/clients"));
  const [editingCoordonnees, setEditingCoordonnees] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const { updateCoordonnees, updatePreferences, noteClientViewed } = useClientsData();
  const { questions: prefQuestions } = usePreferenceConfig();

  const { row, preferences, upcoming, history } = detail;
  const noun = clientNoun(row.gender);
  const conversation = conversationByClientId(row.id);
  const canContact = Boolean(row.whatsapp || row.phone || row.email);

  useEffect(() => {
    noteClientViewed(row.id);
  }, [row.id, noteClientViewed]);

  const contact = () => {
    if (row.whatsapp) window.open(`https://wa.me/${row.whatsapp.replace(/\D/g, "")}`, "_blank");
    else if (row.phone) window.open(`tel:${row.phone.replace(/\s/g, "")}`, "_self");
    else if (row.email) window.open(`mailto:${row.email}`, "_self");
  };

  return (
    <DetailModal title={noun === "client" ? "Fiche client" : "Fiche cliente"} onClose={close} widthClassName="max-w-6xl">
      {/* Bandeau d'identité collant : qui elle est, son numéro, ce qu'elle a déjà payé d'avance. */}
      <div className="sticky -top-6 z-30 -mx-6 -mt-6 mb-7 border-b border-base-300 bg-base-100 px-6 pt-4 shadow-[0_8px_10px_-6px_rgba(0,0,0,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar initial={initialsOf(row.name)} size={60} className="bg-accent text-xl font-semibold text-secondary" />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="truncate text-[28px] leading-tight font-semibold tracking-[-0.01em] text-base-content">{row.name}</h2>
                {row.tier && <Badge variant={row.tier}>{TIER_LABEL[row.tier]}</Badge>}
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-base-content/60">
                <span className="rounded-md bg-base-200 px-2 py-0.5 font-semibold tabular-nums text-base-content">
                  {clientNumberLabel(row.number)}
                </span>
                <span className="truncate">
                  {noun === "client" ? "Client" : "Cliente"} depuis {monthYear(row.since)}
                  {row.lastVisit ? ` · dernière visite le ${frLongDate(row.lastVisit)}` : " · jamais venue"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" icon={<MessageCircle className="size-5" />} disabled={!canContact} onClick={contact}>
              Contacter
            </Button>
            <Button variant="brand" icon={<CalendarPlus className="size-5" />} href={`/rendez-vous?nouveau=1&client=${row.id}`}>
              Nouveau rendez-vous
            </Button>
          </div>
        </div>
        {!canContact && (
          <p className="mt-2 text-xs text-base-content/50">Aucune coordonnée enregistrée — ajoutez un téléphone pour pouvoir la contacter.</p>
        )}
        <AtAGlance row={row} />
      </div>

      <div className="grid items-start gap-7 grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* Ce qui sert au passage : goûts, prépayé, ce que l'équipe a noté. */}
        <div className="flex flex-col gap-7">
          <PreferencesBoard prefs={preferences} questions={prefQuestions} onEdit={() => setEditingPreferences(true)} />
          <AbonnementsPacksBoard clientId={row.id} />
          <NotesBoard clientId={row.id} />
        </div>

        {/* La référence : la joindre, l'identifier, et ce qu'on s'est écrit. */}
        <div className="flex flex-col gap-7">
          <CoordonneesBoard row={row} onEdit={() => setEditingCoordonnees(true)} />
          <Board legend="Carte de fidélité">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-base-content/60">Le QR d&apos;identification de la cliente.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<Printer className="size-5" />} onClick={() => window.print()}>
                    Imprimer
                  </Button>
                </div>
              </div>
              <DemoQr seed={row.id} />
            </div>
          </Board>
          <EchangesBoard firstName={row.name.split(" ")[0]} conversation={conversation} clientId={row.id} />
        </div>
      </div>

      {/* Rendez-vous — lus dans les vraies réservations (`@/lib/mock/rendezvous`). */}
      <div className="mt-9 flex flex-col gap-7 border-t border-base-300 pt-7">
        <section id="rendez-vous" className="scroll-mt-4 space-y-2">
          <div className="pl-1">
            <Legend>Rendez-vous à venir</Legend>
          </div>
          <DataTable
            columns={upcomingColumns}
            rows={upcoming}
            rowKey={(v) => v.rdvId ?? `${v.date}-${v.service}`}
            empty="Aucun rendez-vous à venir."
          />
        </section>
        <section id="historique" className="scroll-mt-4 space-y-2">
          <div className="pl-1">
            <Legend>Dernières visites</Legend>
          </div>
          <DataTable
            columns={historyColumns}
            rows={history}
            rowKey={(v) => v.rdvId ?? `${v.date}-${v.service}`}
            empty="Aucune visite enregistrée."
          />
        </section>
        <div className="flex justify-end">
          <ClientDetailActions clientName={row.name} noun={noun} />
        </div>
      </div>

      <EditCoordonneesDialog
        open={editingCoordonnees}
        initial={{
          phone: row.phone,
          whatsapp: row.whatsapp ?? "",
          email: row.email,
          address: row.address,
          profession: row.profession ?? "",
          residenceCountry: row.residenceCountry,
          birthday: row.birthday,
          ethnicity: row.ethnicity,
        }}
        onClose={() => setEditingCoordonnees(false)}
        onSave={(patch) => updateCoordonnees(row.id, patch)}
      />
      <EditPreferencesDialog
        open={editingPreferences}
        initial={preferences}
        onClose={() => setEditingPreferences(false)}
        questions={prefQuestions}
        onSave={(prefs) => updatePreferences(row.id, prefs)}
      />
    </DetailModal>
  );
}
