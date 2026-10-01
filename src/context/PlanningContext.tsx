"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Weekday } from "@/lib/mock/beautyandco";
import {
  absences as absenceSeeds,
  shiftOverrides as overrideSeeds,
  type Absence,
  type PlanningData,
  type ShiftOverride,
} from "@/lib/mock/planning";
import type { DayShift } from "@/lib/mock/staff";

// Présence de l'équipe (absences + ajustements d'horaire + horaires habituels
// modifiés) : état de session partagé entre l'onglet Planning de `/equipe`
// (éditeur des horaires, 2026-09-28), l'agenda « Par praticienne » de
// `/rendez-vous` et l'affectation automatique des rendez-vous — une seule
// source de vérité, pas un état dupliqué qui pourrait diverger entre écrans.

export type BaseHoursMap = Record<string, Record<Weekday, DayShift>>;

type PlanningContextType = {
  absences: Absence[];
  setAbsences: React.Dispatch<React.SetStateAction<Absence[]>>;
  overrides: ShiftOverride[];
  setOverrides: React.Dispatch<React.SetStateAction<ShiftOverride[]>>;
  /** Horaires habituels modifiés en session, par membre (sinon `Member.baseHours`). */
  baseHours: BaseHoursMap;
  setBaseHours: React.Dispatch<React.SetStateAction<BaseHoursMap>>;
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
  const [baseHours, setBaseHours] = useState<BaseHoursMap>({});

  const addAbsence = (absence: Absence) => setAbsences((list) => [...list, absence]);

  // Objet stable tant que rien ne change : `data` sert de dépendance de mémo
  // (affectation automatique des rendez-vous) sur plusieurs écrans.
  const data = useMemo<PlanningData>(
    () => ({ absences, shiftOverrides: overrides, baseHours }),
    [absences, overrides, baseHours],
  );

  const value: PlanningContextType = {
    absences,
    setAbsences,
    overrides,
    setOverrides,
    baseHours,
    setBaseHours,
    data,
    addAbsence,
  };

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
};
