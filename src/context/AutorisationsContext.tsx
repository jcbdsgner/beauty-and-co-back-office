"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  applyCapability,
  defaultAutorisations,
  type Autorisations,
  type Capability,
} from "@/lib/mock/autorisations";
import type { StaffRole } from "@/lib/mock/staff";

// Autorisations par rôle (2026-09-27) — réglées dans Réglages › Autorisations,
// lues par la fiche membre d'Équipe (« Ce que ce membre peut faire »). Levées
// hors de `Equipe.tsx` quand la matrice a quitté l'écran Équipe pour Réglages :
// les deux écrans doivent voir la même donnée. État de session (PAS de
// persistance), même famille que `PreferencesContext`.

type AutorisationsContextType = {
  autorisations: Autorisations;
  /** Coche / décoche une autorisation — cascade des prérequis via `applyCapability`. */
  setRoleCapability: (role: StaffRole, cap: Capability, value: boolean) => void;
  resetRole: (role: StaffRole) => void;
};

const AutorisationsContext = createContext<AutorisationsContextType | undefined>(undefined);

export const useAutorisations = () => {
  const ctx = useContext(AutorisationsContext);
  if (!ctx) throw new Error("useAutorisations doit être utilisé dans un AutorisationsProvider");
  return ctx;
};

export function AutorisationsProvider({ children }: { children: ReactNode }) {
  const [autorisations, setAutorisations] = useState<Autorisations>(defaultAutorisations);

  const setRoleCapability = useCallback(
    (role: StaffRole, cap: Capability, value: boolean) =>
      setAutorisations((current) => ({
        ...current,
        [role]: applyCapability(current[role], cap, value),
      })),
    [],
  );

  const resetRole = useCallback(
    (role: StaffRole) =>
      setAutorisations((current) => ({ ...current, [role]: { ...defaultAutorisations[role] } })),
    [],
  );

  const value = useMemo(
    () => ({ autorisations, setRoleCapability, resetRole }),
    [autorisations, setRoleCapability, resetRole],
  );
  return <AutorisationsContext.Provider value={value}>{children}</AutorisationsContext.Provider>;
}
