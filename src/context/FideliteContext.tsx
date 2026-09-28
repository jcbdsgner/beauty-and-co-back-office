"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultRewards,
  defaultSettings,
  defaultTiers,
  type LoyaltyReward,
  type LoyaltySettings,
  type LoyaltyTier,
} from "@/lib/mock/fidelite";
import { forfaitSeeds, type Forfait } from "@/lib/mock/forfaits";
import { packSeeds, type Pack } from "@/lib/mock/packs";

// Configuration de la fidélité et des offres (2026-09-27) — programme de points
// (accumulation, paliers, récompenses) et catalogue des forfaits / packs,
// réglés dans Réglages, lus par l'écran Fidélité (souscrire un forfait,
// vendre un pack). Levés hors de `Fidelite.tsx` quand la configuration a
// quitté cet écran pour Réglages : sans ça, un forfait créé dans Réglages
// n'apparaîtrait pas au moment de le souscrire. État de session (PAS de
// persistance). Les abonnements et packs vendus (le suivi) restent un état
// local à l'écran Fidélité, comme avant.

type FideliteContextType = {
  settings: LoyaltySettings;
  setSettings: (s: LoyaltySettings) => void;
  tiers: LoyaltyTier[];
  setTiers: (t: LoyaltyTier[]) => void;
  rewards: LoyaltyReward[];
  setRewards: (r: LoyaltyReward[]) => void;
  forfaits: Forfait[];
  setForfaits: (f: Forfait[]) => void;
  packs: Pack[];
  setPacks: (p: Pack[]) => void;
};

const FideliteContext = createContext<FideliteContextType | undefined>(undefined);

export const useFideliteConfig = () => {
  const ctx = useContext(FideliteContext);
  if (!ctx) throw new Error("useFideliteConfig doit être utilisé dans un FideliteProvider");
  return ctx;
};

export function FideliteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);
  const [tiers, setTiers] = useState<LoyaltyTier[]>(defaultTiers);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(defaultRewards);
  const [forfaits, setForfaits] = useState<Forfait[]>(forfaitSeeds);
  const [packs, setPacks] = useState<Pack[]>(packSeeds);

  const value = useMemo(
    () => ({ settings, setSettings, tiers, setTiers, rewards, setRewards, forfaits, setForfaits, packs, setPacks }),
    [settings, tiers, rewards, forfaits, packs],
  );
  return <FideliteContext.Provider value={value}>{children}</FideliteContext.Provider>;
}
