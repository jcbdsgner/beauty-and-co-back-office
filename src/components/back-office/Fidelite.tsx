"use client";

import { useState, type ReactNode } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
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
import {
  abonnementSeeds,
  packPurchaseSeeds,
  type Abonnement,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import AccrualSettings from "./fidelite/AccrualSettings";
import TiersPanel from "./fidelite/TiersPanel";
import RewardsPanel from "./fidelite/RewardsPanel";
import ForfaitsPanel from "./fidelite/ForfaitsPanel";
import PacksPanel from "./fidelite/PacksPanel";
import AbonnementsPanel from "./fidelite/AbonnementsPanel";
import PackSalesPanel from "./fidelite/PackSalesPanel";

// Écran « Fidélité & abonnements ».
// 1. Où en est la propriétaire ? Deux registres. Retouche rapide (« ce forfait
//    passe à 70.000 », « marquer l'échéance de Mme Fall payée ») : elle entre,
//    corrige, sort. Mise en place (« créer un pack », « régler les paliers ») :
//    session posée. C'est un écran de configuration ET de suivi.
// 2. Ce qui doit sauter aux yeux : dans « Abonnements en cours », qui a une
//    échéance à encaisser (badge rouge « À régler ») — c'est de l'argent qui
//    dort. Ailleurs : la liste des offres et leur prix.
// 3. Quand ça se passe mal : aucune offre → état vide explicite ; un abonnement
//    révoqué reste visible, grisé ; un pack entièrement consommé est marqué et
//    ne propose plus d'action.
//
// Aucun backend : tout est édité en mémoire de session. La vraie auth, le vrai
// paiement récurrent (PSP) et le parcours de souscription en ligne sont hors
// périmètre de ce squelette front-end.

type Section = "fidelite" | "offres" | "abonnements";

const SECTIONS: SegmentedOption<Section>[] = [
  { value: "fidelite", label: "Fidélité" },
  { value: "offres", label: "Forfaits & Packs" },
  { value: "abonnements", label: "Abonnements" },
];

const GearIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 2.8v2.3M12 18.9v2.3M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.8 12h2.3M18.9 12h2.3M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const MedalIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M8.5 3.5l3.5 6 3.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="15" r="5.3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 12.6l.9 1.8 2 .3-1.45 1.4.35 2L12 17.15 10.2 18.1l.35-2L9.1 14.7l2-.3z" fill="currentColor" />
  </svg>
);

const GiftIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M4.5 9.5h15v3h-15zM6 12.5v7.5h12v-7.5M12 9.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path
      d="M12 9.5S11.2 5 8.7 5A2.2 2.2 0 0 0 8.7 9.5zM12 9.5S12.8 5 15.3 5A2.2 2.2 0 0 1 15.3 9.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const RepeatIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M4 9a6 6 0 0 1 10-2.5L17 9M20 15A6 6 0 0 1 10 17.5L7 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 5v4h-4M7 19v-4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BoxIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

type Tab = { id: string; label: string; icon: ReactNode };

const SUB_TABS: Record<Section, Tab[]> = {
  fidelite: [
    { id: "settings", label: "Paramètres", icon: GearIcon },
    { id: "tiers", label: "Paliers", icon: MedalIcon },
    { id: "rewards", label: "Récompenses", icon: GiftIcon },
  ],
  offres: [
    { id: "forfaits", label: "Forfaits", icon: RepeatIcon },
    { id: "packs", label: "Packs", icon: BoxIcon },
  ],
  abonnements: [
    { id: "encours", label: "Abonnements en cours", icon: RepeatIcon },
    { id: "ventes", label: "Packs vendus", icon: BoxIcon },
  ],
};

const SECTION_INTRO: Record<Section, string> = {
  fidelite:
    "Comment les clientes gagnent des points, les cartes de fidélité par palier et les récompenses échangeables.",
  offres:
    "Les offres proposées à la réservation : forfaits d'abonnement (récurrents) et packs prépayés (achat unique).",
  abonnements:
    "Le suivi des abonnements souscrits et des packs vendus : échéances à encaisser, révocations, consommation des prestations.",
};

export default function Fidelite() {
  const [section, setSection] = useState<Section>("fidelite");
  const [subTab, setSubTab] = useState<string>(SUB_TABS.fidelite[0].id);

  // Aucun backend : tout est édité en mémoire de session.
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);
  const [tiers, setTiers] = useState<LoyaltyTier[]>(defaultTiers);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(defaultRewards);
  const [forfaits, setForfaits] = useState<Forfait[]>(forfaitSeeds);
  const [packs, setPacks] = useState<Pack[]>(packSeeds);
  const [abonnements, setAbonnements] = useState<Abonnement[]>(abonnementSeeds);
  const [packPurchases, setPackPurchases] = useState<PackPurchase[]>(packPurchaseSeeds);

  const [notice, setNotice] = useState<string | null>(null);

  const pickSection = (next: Section) => {
    setSection(next);
    setSubTab(SUB_TABS[next][0].id);
  };

  const tabs = SUB_TABS[section];

  return (
    <div className="space-y-6">
      <PageHeader title="Fidélité & abonnements" description={SECTION_INTRO[section]} />

      <SegmentedControl
        options={SECTIONS}
        value={section}
        onChange={pickSection}
        aria-label="Section de l'écran fidélité"
      />

      <div
        role="tablist"
        aria-label={`Sous-sections — ${section}`}
        className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1"
      >
        {tabs.map((t) => {
          const active = t.id === subTab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-theme-sm font-medium transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <p className="rounded-lg bg-gray-900 px-4 py-2.5 text-theme-sm font-medium text-white">
          {notice}
        </p>
      )}

      <div role="tabpanel" className="max-w-3xl">
        {section === "fidelite" && subTab === "settings" && (
          <AccrualSettings settings={settings} onSave={setSettings} />
        )}
        {section === "fidelite" && subTab === "tiers" && (
          <TiersPanel tiers={tiers} onChange={setTiers} />
        )}
        {section === "fidelite" && subTab === "rewards" && (
          <RewardsPanel rewards={rewards} onChange={setRewards} />
        )}

        {section === "offres" && subTab === "forfaits" && (
          <ForfaitsPanel forfaits={forfaits} onChange={setForfaits} />
        )}
        {section === "offres" && subTab === "packs" && (
          <PacksPanel packs={packs} onChange={setPacks} />
        )}

        {section === "abonnements" && subTab === "encours" && (
          <AbonnementsPanel
            abonnements={abonnements}
            forfaits={forfaits}
            onChange={setAbonnements}
            notify={setNotice}
          />
        )}
        {section === "abonnements" && subTab === "ventes" && (
          <PackSalesPanel
            purchases={packPurchases}
            packs={packs}
            onChange={setPackPurchases}
            notify={setNotice}
          />
        )}
      </div>
    </div>
  );
}
