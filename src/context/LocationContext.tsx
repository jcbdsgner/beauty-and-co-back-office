"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { salons, scopeFromIds, scopeIds, type SalonId, type SalonScope } from "@/lib/mock/beautyandco";

// Filtre salon global : une seule source de vérité pour « quel salon je regarde ».
// Persisté en localStorage, consommé par le header et les écrans.

type LocationContextType = {
  scope: SalonScope;
  setScope: (scope: SalonScope) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "bo.salon-scope";

// Stocké en texte : « all » ou les ids cochés séparés par des virgules. Un id
// inconnu (salon retiré depuis) est ignoré ; rien de valide → « all ».
const parseScope = (v: string | null): SalonScope => {
  if (!v || v === "all") return "all";
  const ids = v.split(",").filter((id): id is SalonId => salons.some((s) => s.id === id));
  return scopeFromIds(ids);
};
const serializeScope = (scope: SalonScope) => (scope === "all" ? "all" : scopeIds(scope).join(","));

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation doit être utilisé dans un LocationProvider");
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scope, setScopeState] = useState<SalonScope>("all");

  useEffect(() => {
    try {
      const stored = parseScope(window.localStorage.getItem(STORAGE_KEY));
      if (stored !== "all") setScopeState(stored);
    } catch {
      /* localStorage indisponible — on reste sur « Tous les salons » */
    }
  }, []);

  const setScope = (value: SalonScope) => {
    const next = scopeFromIds(scopeIds(value));
    setScopeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeScope(next));
    } catch {
      /* pas de persistance possible, sans gravité */
    }
  };

  return (
    <LocationContext.Provider value={{ scope, setScope }}>{children}</LocationContext.Provider>
  );
};
