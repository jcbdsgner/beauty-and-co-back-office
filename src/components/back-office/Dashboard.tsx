"use client";

import DashboardHeader from "@/components/back-office/dashboard/DashboardHeader";
import TodayAppointments from "@/components/back-office/TodayAppointments";
import TodayKpiCards from "@/components/back-office/dashboard/TodayKpiCards";
import PopularServices from "@/components/back-office/PopularServices";
import NotificationsPanel from "@/components/back-office/dashboard/NotificationsPanel";
import AccesRapides from "@/components/back-office/dashboard/AccesRapides";
import { useLocation } from "@/context/LocationContext";

// Refonte sur le Figma « Tableau de bord » (node 286:6, voir CLAUDE.md
// « Refonte Figma tableau de bord »). Grille unique 65/35 (node 286:31) :
// colonne principale = RDV du jour + KPIs du jour + prestations populaires ;
// colonne de droite (286:295) = `NotificationsPanel` (« Actions à traiter »)
// + `AccesRapides` (« Accès Rapides »), restylées par une autre session sur
// ce même chantier — cf. leur propre entrée dans la carte du code.
//
// Écarts volontaires par rapport au Figma :
// - Filtre salon conservé dans l'en-tête (`DashboardHeader`), à la place des
//   pastilles de période du mock — le reste de la page est toujours « le
//   jour même » / « 30 derniers jours », des pastilles de période n'y
//   pilotaient donc rien (voir le commentaire dans `DashboardHeader.tsx`).
// - Les anciennes sections « Indicateurs de la période » (grille de 5 cartes
//   StatCards, incl. revenu récurrent), le graphe de tendances (`TrendChart`)
//   et le bloc « Autres écrans » en bas de page sont retirés : absents du
//   Figma, et « Accès Rapides » (colonne de droite) reprend déjà les liens
//   Rapports/Avis clients/Stock/Journal de l'ancien bloc « Autres écrans ».
//   `StatCards.tsx` et `TrendChart.tsx` restent utilisés ailleurs (vitrine
//   design-system pour le premier), non supprimés.
export default function Dashboard() {
  const { scope, setScope } = useLocation();

  return (
    <div className="space-y-6">
      <DashboardHeader scope={scope} onScopeChange={setScope} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <TodayAppointments scope={scope} />
          <TodayKpiCards scope={scope} />
          <PopularServices scope={scope} />
        </div>

        <div className="xl:col-span-1">
          <div className="space-y-6 xl:sticky xl:top-24">
            <NotificationsPanel />
            <AccesRapides />
          </div>
        </div>
      </div>
    </div>
  );
}
