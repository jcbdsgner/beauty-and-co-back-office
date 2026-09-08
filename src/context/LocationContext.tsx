"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";

// Filtre salon global : une seule source de vérité pour « quel salon je regarde ».
// Persisté en localStorage, consommé par le header et les écrans.

type LocationContextType = {
  scope: SalonScope;
  setScope: (scope: SalonScope) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "bo.salon-scope";

const isValidScope = (v: string | null): v is SalonScope =>
  v === "all" || salons.some((s) => s.id === v);

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
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isValidScope(stored)) setScopeState(stored);
    } catch {
      /* localStorage indisponible — on reste sur « Tous les salons » */
    }
  }, []);

  const setScope = (next: SalonScope) => {
    setScopeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* pas de persistance possible, sans gravité */
    }
  };

  return (
    <LocationContext.Provider value={{ scope, setScope }}>{children}</LocationContext.Provider>
  );
};
