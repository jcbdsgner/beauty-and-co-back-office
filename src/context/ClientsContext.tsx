"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_CLIENT_PREFERENCES } from "@/lib/mock/preferences";
import {
  CLIENT_NOTE_SEEDS,
  clientDetail as seedClientDetail,
  clients as seedClients,
  daysSince,
  nextClientNumber,
  salonName,
  segmentOf,
  type ClientDetail,
  type ClientEthnicity,
  type ClientGender,
  type ClientPreferences,
  type ClientRow,
  type ClientVisit,
  inScope,
  type SalonId,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import { allRendezvous, type RdvDetail } from "@/lib/mock/rendezvous";

// État de session pour la clientèle — même famille que `PlanningContext` :
// aucune persistance, remis à zéro au rechargement. Reprend ce que la caisse
// (point-de-vente, qui fait autorité) permet sur une fiche : création,
// coordonnées, préférences, notes internes signées, « Vues récemment ».
//
// Jointure avec les rendez-vous (`@/lib/mock/rendezvous`) faite ici, pas dans
// `beautyandco` (qui est importé par `rendezvous` — cycle) : les rendez-vous à
// venir de la fiche, sa dernière visite et l'historique récent viennent des
// vraies réservations, plus d'une liste parallèle.

export type ClientCoordonnees = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  profession: string;
  residenceCountry: string;
  birthday: string; // « MM-JJ »
  ethnicity: ClientEthnicity;
};

export type ClientNote = {
  id: string;
  text: string;
  at: string;
  authorId: string;
  origin: "fiche" | "encaissement";
};

type ClientOverride = {
  coordonnees?: Partial<ClientCoordonnees>;
  preferences?: ClientPreferences;
};

export type NewClientDraft = {
  name: string;
  gender: ClientGender;
  salon: SalonId;
} & ClientCoordonnees;

type CreatedClient = NewClientDraft & { id: string; number: number; createdAt: string };

const SEED_NOTES: Record<string, ClientNote[]> = Object.fromEntries(
  Object.entries(CLIENT_NOTE_SEEDS).map(([id, list]) => [
    id,
    list.map((n, i) => ({ id: `note-seed-${id}-${i}`, ...n })),
  ]),
);

const newClientId = () => `c-${Date.now().toString(36)}`;
const newNoteId = () => `note-${Date.now().toString(36)}`;
// « Aujourd'hui » du monde de démo (cf. `TODAY_ISO` de `@/lib/mock/planning`).
const TODAY = "2026-09-03";

const RECENT_MAX = 5;

function createdToRow(c: CreatedClient): ClientRow {
  return {
    id: c.id,
    number: c.number,
    name: c.name,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp || null,
    gender: c.gender,
    address: c.address,
    profession: c.profession || null,
    residenceCountry: c.residenceCountry,
    birthday: c.birthday,
    ethnicity: c.ethnicity,
    salon: c.salon,
    salonLabel: salonName(c.salon),
    since: c.createdAt,
    tier: null,
    preferredStaffId: null,
    lastVisit: null,
    daysSinceLastVisit: null,
    totalSpent: 0,
    appointments: 0,
    upcoming: 0,
    loyaltyPoints: 0,
    segment: "occasionnelle",
  };
}

/* --- jointure rendez-vous ------------------------------------------- */

const RDVS = allRendezvous();

// Une cliente « a » un rendez-vous si elle le paie ou y reçoit une prestation.
const concerns = (r: RdvDetail, clientId: string) =>
  r.client.id === clientId || r.prestations.some((p) => p.beneficiaryClientId === clientId);

const rdvToVisit = (r: RdvDetail, clientId: string): ClientVisit => {
  const mine = r.client.id === clientId ? r.prestations : r.prestations.filter((p) => p.beneficiaryClientId === clientId);
  const staff = [...new Set(mine.map((p) => p.staff).filter((s): s is string => Boolean(s)))];
  return {
    date: r.date.slice(0, 10),
    time: r.date.slice(11, 16),
    service: mine.map((p) => p.name).join(" · "),
    staff: staff.join(", ") || "—",
    amount: r.status === "terminé" ? mine.reduce((s, p) => s + p.price, 0) : 0,
    status: r.status === "à venir" ? "à venir" : r.status === "terminé" ? "honoré" : "annulé",
    rdvId: r.id,
  };
};

function withRdvs(detail: ClientDetail): ClientDetail {
  const id = detail.row.id;
  const visits = RDVS.filter((r) => concerns(r, id)).map((r) => rdvToVisit(r, id));
  const upcoming = visits
    .filter((x) => x.status === "à venir")
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  const history = [...visits.filter((x) => x.status !== "à venir"), ...detail.history].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const lastVisit = history.find((x) => x.status === "honoré")?.date ?? null;
  const days = lastVisit ? daysSince(lastVisit) : null;
  const all = [...upcoming, ...history];
  const count = (s: ClientVisit["status"]) => all.filter((x) => x.status === s).length;
  return {
    ...detail,
    row: { ...detail.row, lastVisit, daysSinceLastVisit: days, segment: segmentOf(days), upcoming: upcoming.length },
    stats: { total: all.length, honoured: count("honoré"), upcoming: count("à venir"), cancelled: count("annulé") },
    upcoming,
    history,
  };
}

/* --- contexte -------------------------------------------------------- */

type ClientsContextType = {
  rows: (scope: SalonScope) => ClientRow[];
  getDetail: (id: string) => ClientDetail | null;
  notesFor: (id: string) => ClientNote[];
  updateCoordonnees: (id: string, patch: Partial<ClientCoordonnees>) => void;
  /** Remplace les préférences de la cliente (notes par domaine, passages, cheveux). */
  updatePreferences: (id: string, prefs: ClientPreferences) => void;
  addNote: (id: string, text: string, authorId: string) => void;
  createClient: (draft: NewClientDraft) => string;
  /** Fiches ouvertes récemment, la plus récente d'abord (« Vues récemment »). */
  recentClientIds: string[];
  noteClientViewed: (id: string) => void;
  /** Payeuses attendues aujourd'hui, avec l'heure de leur premier rendez-vous. */
  expectedToday: { clientId: string; start: string }[];
};

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const useClientsData = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClientsData doit être utilisé dans un ClientsProvider");
  return ctx;
};

const applyCoordonnees = (row: ClientRow, c?: Partial<ClientCoordonnees>): ClientRow =>
  c
    ? {
        ...row,
        phone: c.phone ?? row.phone,
        whatsapp: c.whatsapp !== undefined ? c.whatsapp || null : row.whatsapp,
        email: c.email ?? row.email,
        address: c.address ?? row.address,
        profession: c.profession !== undefined ? c.profession || null : row.profession,
        residenceCountry: c.residenceCountry ?? row.residenceCountry,
        birthday: c.birthday ?? row.birthday,
        ethnicity: c.ethnicity ?? row.ethnicity,
      }
    : row;

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ClientOverride>>({});
  const [notes, setNotes] = useState<Record<string, ClientNote[]>>(SEED_NOTES);
  const [created, setCreated] = useState<CreatedClient[]>([]);
  const [recentClientIds, setRecent] = useState<string[]>([]);

  const getDetail = useCallback(
    (id: string): ClientDetail | null => {
      const o = overrides[id];
      const seed = seedClientDetail(id);
      if (seed) {
        const joined = withRdvs(seed);
        return {
          ...joined,
          row: applyCoordonnees(joined.row, o?.coordonnees),
          preferences: o?.preferences ?? joined.preferences,
        };
      }
      const c = created.find((x) => x.id === id);
      if (!c) return null;
      return {
        row: applyCoordonnees(createdToRow(c), o?.coordonnees),
        preferences: o?.preferences ?? EMPTY_CLIENT_PREFERENCES,
        stats: { total: 0, honoured: 0, upcoming: 0, cancelled: 0 },
        upcoming: [],
        history: [],
      };
    },
    [created, overrides],
  );

  const rows = useCallback(
    (scope: SalonScope) => {
      const base = seedClients(scope).map((r) => getDetail(r.id)!.row);
      const extra = created
        .filter((c) => inScope(scope, c.salon))
        .map((c) => applyCoordonnees(createdToRow(c), overrides[c.id]?.coordonnees));
      return [...extra, ...base];
    },
    [created, overrides, getDetail],
  );

  const notesFor = useCallback((id: string) => notes[id] ?? [], [notes]);

  const updateCoordonnees = useCallback((id: string, patch: Partial<ClientCoordonnees>) => {
    setOverrides((cur) => ({
      ...cur,
      [id]: { ...cur[id], coordonnees: { ...cur[id]?.coordonnees, ...patch } },
    }));
  }, []);

  const updatePreferences = useCallback((id: string, prefs: ClientPreferences) => {
    setOverrides((cur) => ({ ...cur, [id]: { ...cur[id], preferences: prefs } }));
  }, []);

  const addNote = useCallback((id: string, text: string, authorId: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotes((cur) => ({
      ...cur,
      [id]: [
        { id: newNoteId(), text: trimmed, at: new Date().toISOString(), authorId, origin: "fiche" },
        ...(cur[id] ?? []),
      ],
    }));
  }, []);

  const createClient = useCallback((draft: NewClientDraft) => {
    const id = newClientId();
    setCreated((cur) => [
      { ...draft, id, number: nextClientNumber(cur.map((c) => c.number)), createdAt: TODAY },
      ...cur,
    ]);
    return id;
  }, []);

  const noteClientViewed = useCallback((id: string) => {
    setRecent((cur) => (cur[0] === id ? cur : [id, ...cur.filter((x) => x !== id)].slice(0, RECENT_MAX)));
  }, []);

  const expectedToday = useMemo(() => {
    const seen = new Set<string>();
    const out: { clientId: string; start: string }[] = [];
    const today = RDVS.filter((r) => r.status === "à venir" && r.date.slice(0, 10) === TODAY).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    for (const r of today) {
      if (seen.has(r.client.id)) continue;
      seen.add(r.client.id);
      out.push({ clientId: r.client.id, start: r.date.slice(11, 16) });
    }
    return out;
  }, []);

  const value = useMemo<ClientsContextType>(
    () => ({
      rows,
      getDetail,
      notesFor,
      updateCoordonnees,
      updatePreferences,
      addNote,
      createClient,
      recentClientIds,
      noteClientViewed,
      expectedToday,
    }),
    [rows, getDetail, notesFor, updateCoordonnees, updatePreferences, addNote, createClient, recentClientIds, noteClientViewed, expectedToday],
  );

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}
