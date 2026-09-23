"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clientDetail as seedClientDetail,
  clients as seedClients,
  salonName,
  type ClientDetail,
  type ClientGender,
  type ClientPreferences,
  type ClientRow,
  type SalonId,
  type SalonScope,
} from "@/lib/mock/beautyandco";

// État de session pour la clientèle — même famille que `PlanningContext` :
// aucune persistance, remis à zéro au rechargement. Comble un manque repéré
// en comparant avec point-de-vente (`NewClientDialog`, `EditCoordonneesDialog`,
// `EditPreferencesDialog`, notes internes de `fiche-cliente-view.tsx`) : back-office
// n'avait jusqu'ici aucun moyen de créer une cliente ni d'éditer sa fiche.
//
// Les fiches clientes existantes (seeds) restent la source de vérité pour tout
// ce qui est dérivé des visites (stats, historique) — seules les coordonnées,
// les préférences et les notes internes sont éditables ici, en overlay.

export type ClientCoordonnees = {
  phone: string;
  email: string;
  address: string;
};

export type ClientNote = { id: string; text: string; at: string };

type ClientOverride = {
  coordonnees?: Partial<ClientCoordonnees>;
  preferences?: Partial<ClientPreferences>;
};

export type NewClientDraft = {
  name: string;
  gender: ClientGender;
  phone: string;
  email: string;
  address: string;
  salon: SalonId;
};

type CreatedClient = NewClientDraft & { id: string; createdAt: string };

const EMPTY_PREFERENCES: ClientPreferences = {
  general: [],
  onglerie: [],
  coiffure: [],
  boissons: [],
};

const newClientId = () => `c-${Date.now().toString(36)}`;
const newNoteId = () => `note-${Date.now().toString(36)}`;
const todayIso = () => new Date().toISOString().slice(0, 10);

function createdToRow(c: CreatedClient): ClientRow {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    gender: c.gender,
    address: c.address,
    salon: c.salon,
    salonLabel: salonName(c.salon),
    since: c.createdAt,
    lastVisit: null,
    daysSinceLastVisit: null,
    totalSpent: 0,
    appointments: 0,
    upcoming: 0,
    loyaltyPoints: 0,
    segment: "occasionnelle",
  };
}

type ClientsContextType = {
  rows: (scope: SalonScope) => ClientRow[];
  getDetail: (id: string) => ClientDetail | null;
  notesFor: (id: string) => ClientNote[];
  updateCoordonnees: (id: string, patch: Partial<ClientCoordonnees>) => void;
  updatePreferences: (id: string, group: keyof ClientPreferences, items: string[]) => void;
  addNote: (id: string, text: string) => void;
  createClient: (draft: NewClientDraft) => string;
};

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const useClientsData = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClientsData doit être utilisé dans un ClientsProvider");
  return ctx;
};

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ClientOverride>>({});
  const [notes, setNotes] = useState<Record<string, ClientNote[]>>({});
  const [created, setCreated] = useState<CreatedClient[]>([]);

  const applyOverride = useCallback(
    (detail: ClientDetail): ClientDetail => {
      const o = overrides[detail.row.id];
      if (!o) return detail;
      return {
        ...detail,
        row: {
          ...detail.row,
          phone: o.coordonnees?.phone ?? detail.row.phone,
          email: o.coordonnees?.email ?? detail.row.email,
          address: o.coordonnees?.address ?? detail.row.address,
        },
        preferences: { ...detail.preferences, ...o.preferences },
      };
    },
    [overrides],
  );

  const rows = useCallback(
    (scope: SalonScope) => {
      const base = seedClients(scope).map((row) => {
        const o = overrides[row.id];
        if (!o) return row;
        return {
          ...row,
          phone: o.coordonnees?.phone ?? row.phone,
          email: o.coordonnees?.email ?? row.email,
          address: o.coordonnees?.address ?? row.address,
        };
      });
      const extra = created
        .filter((c) => scope === "all" || c.salon === scope)
        .map(createdToRow);
      return [...extra, ...base];
    },
    [overrides, created],
  );

  const getDetail = useCallback(
    (id: string): ClientDetail | null => {
      const seed = seedClientDetail(id);
      if (seed) return applyOverride(seed);
      const c = created.find((x) => x.id === id);
      if (!c) return null;
      const o = overrides[id];
      return {
        row: createdToRow(c),
        preferences: { ...EMPTY_PREFERENCES, ...o?.preferences },
        stats: { total: 0, honoured: 0, upcoming: 0, cancelled: 0 },
        upcoming: [],
        history: [],
      };
    },
    [created, overrides, applyOverride],
  );

  const notesFor = useCallback((id: string) => notes[id] ?? [], [notes]);

  const updateCoordonnees = useCallback((id: string, patch: Partial<ClientCoordonnees>) => {
    setOverrides((cur) => ({
      ...cur,
      [id]: { ...cur[id], coordonnees: { ...cur[id]?.coordonnees, ...patch } },
    }));
  }, []);

  const updatePreferences = useCallback(
    (id: string, group: keyof ClientPreferences, items: string[]) => {
      setOverrides((cur) => ({
        ...cur,
        [id]: {
          ...cur[id],
          preferences: { ...cur[id]?.preferences, [group]: items },
        },
      }));
    },
    [],
  );

  const addNote = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotes((cur) => ({
      ...cur,
      [id]: [{ id: newNoteId(), text: trimmed, at: new Date().toISOString() }, ...(cur[id] ?? [])],
    }));
  }, []);

  const createClient = useCallback((draft: NewClientDraft) => {
    const id = newClientId();
    setCreated((cur) => [{ ...draft, id, createdAt: todayIso() }, ...cur]);
    return id;
  }, []);

  const value = useMemo<ClientsContextType>(
    () => ({ rows, getDetail, notesFor, updateCoordonnees, updatePreferences, addNote, createClient }),
    [rows, getDetail, notesFor, updateCoordonnees, updatePreferences, addNote, createClient],
  );

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}
