"use client";

import { useMemo } from "react";
import DashboardHeader from "@/components/back-office/dashboard/DashboardHeader";
import DayDecisions, { useDayDecisions } from "@/components/back-office/dashboard/DayDecisions";
import DayFeed from "@/components/back-office/dashboard/DayFeed";
import TodayKpiCards from "@/components/back-office/dashboard/TodayKpiCards";
import PopularServices from "@/components/back-office/PopularServices";
import AccesRapides from "@/components/back-office/dashboard/AccesRapides";
import { todayVisits } from "@/components/back-office/dashboard/today";
import { usePlanningData } from "@/context/PlanningContext";
import { useLocation } from "@/context/LocationContext";

// Accueil « Décider d'abord » (refonte du 2026-09-27, voir CLAUDE.md
// « Refonte de l'accueil ») : une phrase-bilan, puis côte à côte ce qu'il
// reste à régler et la journée à partir de maintenant ; en bas, au calme, les
// repères chiffrés, les prestations les plus demandées et les autres écrans.
export default function Dashboard() {
  const { scope, setScope } = useLocation();
  const { data: planningData } = usePlanningData();
  const visits = useMemo(() => todayVisits(scope, planningData), [scope, planningData]);
  const { decisions, markRead } = useDayDecisions(visits, scope === "all");

  const remaining = visits.filter((v) => v.phase !== "past" && !v.closed);
  const lastEnd = remaining.reduce((max, v) => (v.end > max ? v.end : max), "");

  return (
    <div className="space-y-8">
      <div>
        <DashboardHeader scope={scope} onScopeChange={setScope} />
        <p className="-mt-2 pl-1 text-[17px] text-base-content/70">
          {remaining.length > 0 ? (
            <>
              Il reste{" "}
              <strong className="font-semibold text-base-content">
                {remaining.length} rendez-vous
              </strong>{" "}
              d&apos;ici <span className="tabular-nums">{lastEnd}</span>
            </>
          ) : (
            "Plus aucun rendez-vous aujourd'hui"
          )}
          {decisions.length > 0 ? (
            <>
              {" "}et{" "}
              <strong className="font-semibold text-base-content">
                {decisions.length} point{decisions.length > 1 ? "s" : ""} à régler
              </strong>
              .
            </>
          ) : (
            ", rien à régler."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-6 min-[1400px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <DayDecisions decisions={decisions} onOpen={markRead} />
        <DayFeed visits={visits} scope={scope} />
      </div>

      <TodayKpiCards scope={scope} visits={visits} />

      <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-stretch gap-6">
        <PopularServices scope={scope} />
        <AccesRapides />
      </div>
    </div>
  );
}
