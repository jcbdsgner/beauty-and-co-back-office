"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { members as memberSeeds, type Member } from "@/lib/mock/staff";
import { staffRequests as requestSeeds, type StaffRequest } from "@/lib/mock/rh";

// État de session de l'écran Équipe (membres + demandes RH), porté par
// `app/(admin)/equipe/layout.tsx` depuis que Membres et Planning sont deux
// routes (`/equipe`, `/equipe/planning`, 2026-09-27) : passer d'un onglet à
// l'autre démonte la page, pas le layout — sans ce fournisseur, une fiche
// membre modifiée serait remise à zéro au retour sur Membres.

type EquipeData = {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  requests: StaffRequest[];
  setRequests: React.Dispatch<React.SetStateAction<StaffRequest[]>>;
};

const EquipeDataContext = createContext<EquipeData | undefined>(undefined);

export const useEquipeData = () => {
  const ctx = useContext(EquipeDataContext);
  if (!ctx) throw new Error("useEquipeData doit être utilisé dans un EquipeDataProvider");
  return ctx;
};

export function EquipeDataProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(memberSeeds);
  const [requests, setRequests] = useState<StaffRequest[]>(requestSeeds);
  const value = useMemo(() => ({ members, setMembers, requests, setRequests }), [members, requests]);
  return <EquipeDataContext.Provider value={value}>{children}</EquipeDataContext.Provider>;
}
