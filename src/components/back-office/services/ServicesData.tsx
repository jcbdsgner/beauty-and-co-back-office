"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  boissonSeeds,
  prestationSeeds,
  questionSeeds,
  serviceSeeds,
  type Boisson,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";

// État de session du catalogue (catégories, prestations, questions, boissons),
// porté par `app/(admin)/layout.tsx` (2026-09-28 ; avant : le layout de
// `/services`) : survit au changement d'onglet Prestations / Boissons, et la
// prise de rendez-vous lit les jours de disponibilité des prestations.

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

type ServicesData = {
  services: Service[];
  setServices: Setter<Service[]>;
  prestations: Prestation[];
  setPrestations: Setter<Prestation[]>;
  questions: ServiceQuestion[];
  setQuestions: Setter<ServiceQuestion[]>;
  boissons: Boisson[];
  setBoissons: Setter<Boisson[]>;
};

const ServicesDataContext = createContext<ServicesData | undefined>(undefined);

export const useServicesData = () => {
  const ctx = useContext(ServicesDataContext);
  if (!ctx) throw new Error("useServicesData doit être utilisé dans un ServicesDataProvider");
  return ctx;
};

export function ServicesDataProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(serviceSeeds);
  const [prestations, setPrestations] = useState<Prestation[]>(prestationSeeds);
  const [questions, setQuestions] = useState<ServiceQuestion[]>(questionSeeds);
  const [boissons, setBoissons] = useState<Boisson[]>(boissonSeeds);
  const value = useMemo(
    () => ({ services, setServices, prestations, setPrestations, questions, setQuestions, boissons, setBoissons }),
    [services, prestations, questions, boissons],
  );
  return <ServicesDataContext.Provider value={value}>{children}</ServicesDataContext.Provider>;
}
