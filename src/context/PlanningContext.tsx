"use client";

import React, { createContext, useContext, useState } from "react";
import {
  absences as absenceSeeds,
  shiftOverrides as overrideSeeds,
  type Absence,
  type PlanningData,
  type ShiftOverride,
} from "@/lib/mock/planning";

// Présence de l'équipe (absences + ajustements d'horaire) : état de session
// partagé entre l'onglet Planning de `/equipe` et l'action rapide « marquer
// absente aujourd'hui » de l'agenda `/rendez-vous` — une seule source de
// vérité, pas un état dupliqué qui pourrait diverger entre les deux écrans
// (auparavant local à `Equipe.tsx`, levé ici pour être lu ailleurs).

type PlanningContextType = {
  absences: Absence[];
  setAbsences: React.Dispatch<React.SetStateAction<Absence[]>>;
  overrides: ShiftOverride[];
  setOverrides: React.Dispatch<React.SetStateAction<ShiftOverride[]>>;
  data: PlanningData;
  addAbsence: (absence: Absence) => void;
};

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanningData = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanningData doit être utilisé dans un PlanningProvider");
  }
  return context;
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [absences, setAbsences] = useState<Absence[]>(absenceSeeds);
  const [overrides, setOverrides] = useState<ShiftOverride[]>(overrideSeeds);

  const addAbsence = (absence: Absence) => setAbsences((list) => [...list, absence]);

  const value: PlanningContextType = {
    absences,
    setAbsences,
    overrides,
    setOverrides,
    data: { absences, shiftOverrides: overrides },
    addAbsence,
  };

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
};
