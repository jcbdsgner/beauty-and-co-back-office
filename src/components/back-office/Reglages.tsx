"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import PaiementPanel from "./reglages/PaiementPanel";
import EmailsPanel from "./reglages/EmailsPanel";

// Écran « Réglages » — fusion de deux configurations à une carte, rarement
// visitées (Paiement, Emails), pour éviter de disperser la propriétaire entre
// deux entrées de sidebar qu'elle n'ouvre presque jamais.
//
// 1. Où en est la propriétaire ? En pilotage, très occasionnellement : elle
//    vient poser un acompte une fois, ajuster un délai de rappel une autre
//    fois. Jamais les deux à la suite.
// 2. Ce qui doit sauter aux yeux : la section demandée (via la sidebar ou un
//    lien direct), pas l'autre.
// 3. Cas dégradés : aucun, ce sont des formulaires de réglages avec leurs
//    propres états (brouillon + dirty) déjà gérés par chaque panneau.

type Section = "paiement" | "emails";

const SECTION_OPTIONS: SegmentedOption<Section>[] = [
  { value: "paiement", label: "Paiement" },
  { value: "emails", label: "Emails" },
];

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  paiement:
    "Encaissement en ligne des réservations, acompte demandé à la cliente et règlement PayPal.",
  emails:
    "Le texte des emails envoyés aux clientes et le réglage de leurs envois.",
};

export default function Reglages() {
  const searchParams = useSearchParams();
  const initialSection: Section =
    searchParams.get("section") === "emails" ? "emails" : "paiement";

  const [section, setSection] = useState<Section>(initialSection);

  // Arrivée depuis un lien externe (ex. Journal) avec ?section=emails alors que
  // l'écran est déjà monté sur /reglages — même motif que `?membre=` sur Équipe.
  const [lastSectionParam, setLastSectionParam] = useState(searchParams.get("section"));
  const sectionParam = searchParams.get("section");
  if (sectionParam !== lastSectionParam) {
    setLastSectionParam(sectionParam);
    if (sectionParam === "emails" || sectionParam === "paiement") {
      setSection(sectionParam);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title="Réglages" description={SECTION_DESCRIPTIONS[section]} />
        <SegmentedControl
          options={SECTION_OPTIONS}
          value={section}
          onChange={setSection}
          aria-label="Paiement ou emails"
        />
      </div>

      {section === "paiement" ? <PaiementPanel /> : <EmailsPanel />}
    </div>
  );
}
