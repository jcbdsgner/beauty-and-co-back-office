"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, CreditCard, Mail, Package, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import { useAutorisations } from "@/context/AutorisationsContext";
import { useFideliteConfig } from "@/context/FideliteContext";
import { cn } from "@/lib/utils";
import PaiementPanel from "./reglages/PaiementPanel";
import EmailsPanel from "./reglages/EmailsPanel";
import PreferencesConfigPanel from "./reglages/PreferencesConfigPanel";
import AccrualSettings from "./fidelite/AccrualSettings";
import TiersPanel from "./fidelite/TiersPanel";
import RewardsPanel from "./fidelite/RewardsPanel";
import ForfaitsPanel from "./fidelite/ForfaitsPanel";
import PacksPanel from "./fidelite/PacksPanel";
import RolePermissions from "./equipe/RolePermissions";

// Écran « Réglages » — toute la configuration du back-office au même endroit,
// en page de paramètres classique : une colonne de sections à gauche, le
// contenu à droite (2026-09-27, remplace la bascule en pastilles). Y ont
// rejoint Paiement / Emails / Préférences clientes : le programme de fidélité
// (points, paliers, récompenses) et les forfaits & packs, sortis de l'écran
// Fidélité, et les autorisations par rôle, sorties de l'écran Équipe — pour
// que les pages de travail quotidien n'aient plus d'onglets de configuration.
//
// 1. Où en est la propriétaire ? En pilotage, très occasionnellement : elle
//    vient poser un acompte une fois, créer un forfait ou ajuster une
//    autorisation une autre fois. Jamais tout à la suite.
// 2. Ce qui doit sauter aux yeux : la section demandée (colonne de gauche ou
//    lien direct `?section=`), et la liste de toutes les autres pour s'y
//    retrouver.
// 3. Cas dégradés : `?section=` inconnu → Paiement. Pour le reste, ce sont des
//    formulaires avec leurs propres états (brouillon + dirty) gérés par chaque
//    panneau.
//
// Refonte 2026-09-28 (skill impeccable) : colonne de sections à icônes, blocs
// « libellé à gauche / contrôle à droite » (`reglages/kit`), une seule barre
// d'enregistrement qui n'apparaît qu'en cas de modification, listes éditées en
// panneau latéral au lieu de formulaires d'ajout toujours ouverts.
//
// La section vit dans l'URL (`?section=`), pas dans un état local : chaque
// entrée de la colonne est un lien, le bouton retour et les liens directs
// (Journal, fiche membre, Fidélité) marchent.

type Section = "paiement" | "emails" | "preferences" | "fidelite" | "offres" | "autorisations";

type Item = { id: Section; label: string; icon: LucideIcon; wide?: boolean };

const GROUPS: { label: string; items: Item[] }[] = [
  { label: "Encaissement", items: [{ id: "paiement", label: "Paiement", icon: CreditCard }] },
  {
    label: "Clientèle",
    items: [
      { id: "emails", label: "Emails", icon: Mail },
      { id: "preferences", label: "Préférences clientes", icon: SlidersHorizontal, wide: true },
      { id: "fidelite", label: "Programme de fidélité", icon: Award },
      { id: "offres", label: "Forfaits & packs", icon: Package },
    ],
  },
  { label: "Équipe", items: [{ id: "autorisations", label: "Autorisations", icon: ShieldCheck, wide: true }] },
];

const ALL = GROUPS.flatMap((g) => g.items);
const isSection = (v: string | null): v is Section => ALL.some((i) => i.id === v);

export default function Reglages() {
  const param = useSearchParams().get("section");
  const section: Section = isSection(param) ? param : "paiement";
  const current = ALL.find((i) => i.id === section)!;

  return (
    <div>
      <PageHeader title="Réglages" />

      <div className="grid grid-cols-[232px_minmax(0,1fr)] items-start gap-10">
        <nav aria-label="Sections des réglages" className="sticky top-24 space-y-6">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 px-3 text-[13px] font-medium text-base-content/50">{g.label}</p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const active = item.id === section;
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/reglages?section=${item.id}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-field px-3 py-2.5 text-[15px] transition-colors",
                          active
                            ? "bg-accent font-semibold text-secondary"
                            : "text-base-content/70 hover:bg-base-100 hover:text-base-content",
                        )}
                      >
                        <Icon
                          aria-hidden
                          className={cn("size-[18px] shrink-0", active ? "text-secondary" : "text-base-content/45")}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <section
          aria-labelledby="reglages-section-title"
          className={cn("min-w-0", current.wide ? "max-w-[1080px]" : "max-w-[880px]")}
        >
          <h2 id="reglages-section-title" className="mb-6 text-2xl font-semibold text-base-content">
            {current.label}
          </h2>
          {/* `key` : changer de section repart d'un brouillon propre. */}
          <div key={section}>
            {section === "paiement" && <PaiementPanel />}
            {section === "emails" && <EmailsPanel />}
            {section === "preferences" && <PreferencesConfigPanel />}
            {section === "fidelite" && <FideliteSection />}
            {section === "offres" && <OffresSection />}
            {section === "autorisations" && <AutorisationsSection />}
          </div>
        </section>
      </div>
    </div>
  );
}

function FideliteSection() {
  const { settings, setSettings, tiers, setTiers, rewards, setRewards } = useFideliteConfig();
  return (
    <div className="space-y-6">
      <AccrualSettings settings={settings} onSave={setSettings} />
      <TiersPanel tiers={tiers} onChange={setTiers} />
      <RewardsPanel rewards={rewards} onChange={setRewards} />
    </div>
  );
}

function OffresSection() {
  const { forfaits, setForfaits, packs, setPacks } = useFideliteConfig();
  return (
    <div className="space-y-6">
      <ForfaitsPanel forfaits={forfaits} onChange={setForfaits} />
      <PacksPanel packs={packs} onChange={setPacks} />
    </div>
  );
}

function AutorisationsSection() {
  const { autorisations, setRoleCapability, resetRole } = useAutorisations();
  return (
    <RolePermissions autorisations={autorisations} onChange={setRoleCapability} onReset={resetRole} />
  );
}
