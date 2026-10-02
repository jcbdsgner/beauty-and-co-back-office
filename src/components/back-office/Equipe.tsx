"use client";

import SalonFilter from "@/components/back-office/shared/SalonFilter";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import PageTabs from "@/components/back-office/PageTabs";
import { PlusIcon } from "@/icons";
import { useLocation } from "@/context/LocationContext";
import { useAutorisations } from "@/context/AutorisationsContext";
import { members as memberSeeds, type Member } from "@/lib/mock/staff";
import { rdvCountByStaffDay } from "@/lib/mock/rendezvous";
import EquipeList from "./equipe/EquipeList";
import MemberDetail from "./equipe/MemberDetail";
import AddMemberFlow from "./equipe/AddMemberFlow";
import PlanningBoard from "./equipe/planning-board/PlanningBoard";
import ScheduleEditor from "./equipe/schedule/ScheduleEditor";
import PointageView from "./equipe/PointageView";

import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { useEquipeData } from "./equipe/EquipeData";
import { BackButton } from "./equipe/ui";

// Écran « Équipe » — le domicile des personnes qui font tourner les salons.
//
// 1. Où en est la propriétaire ? Plutôt en pilotage sur l'équipe (elle ne fait
//    pas les gestes à la place des collaboratrices). Elle vient vérifier qui a
//    un accès à l'appli, ajouter une recrue, corriger un horaire habituel ou
//    cocher une nouvelle compétence. Registre posé.
// 2. Ce qui doit sauter aux yeux : la liste de l'équipe avec, pour chacune, son
//    rôle, ses salons et l'état de son compte (a-t-elle accès à la plateforme ?).
// 3. Quand ça se passe mal : praticienne sans compétence → elle n'apparaît pas à
//    la réservation (alerte) ; décocher la dernière personne compétente d'une
//    prestation → alerte ; recherche sans résultat → message ; désactivation →
//    confirmation, l'historique est gardé.

//
// Trois onglets, trois routes : Membres = `/equipe`, Planning =
// `/equipe/planning` (`?vue=planning` redirige), Pointage = `/equipe/pointage`
// (2026-10-02, auparavant une vue du Journal). La matrice des autorisations
// par rôle est partie dans Réglages › Autorisations (configuration, pas travail
// quotidien) ; l'état membres / demandes vit dans `equipe/EquipeData`.

export type EquipeTab = "membres" | "planning" | "pointage";


type View = { kind: "list" } | { kind: "detail"; id: string } | { kind: "new" };

export default function Equipe({ tab }: { tab: EquipeTab }) {
  const { scope, setScope } = useLocation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Aucun backend : tout est édité en mémoire de session (comme Services / Fidélité).
  const { members, setMembers, requests, setRequests } = useEquipeData();
  const { autorisations } = useAutorisations();
  const [view, setView] = useState<View>({ kind: "list" });
  // Planning : « Horaires » (le programme de chaque membre, éditable — 2026-09-28) ou
  // « Rendez-vous » (la journée / la semaine telles que réservées, lecture).
  const [planningMode, setPlanningMode] = useState<"horaires" | "rendez-vous">("horaires");

  // Arrivée depuis une notification « demande en attente » : ?membre=<id> ouvre
  // directement la fiche — y compris si la propriétaire est déjà sur /equipe et
  // clique la notif (le param change sans remontage). Ajustement d'état pendant
  // le rendu, même motif que pour une fiche ouverte par lien.
  // Id inconnu → ignoré, on reste sur la liste.
  const memberParam = searchParams.get("membre");
  const [lastMemberParam, setLastMemberParam] = useState<string | null>(null);
  if (memberParam !== lastMemberParam) {
    setLastMemberParam(memberParam);
    if (memberParam && memberSeeds.some((m) => m.id === memberParam)) {
      setView({ kind: "detail", id: memberParam });
    }
  }

  const patchMember = (id: string, patch: Partial<Member>) =>
    setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addMember = (member: Member) => setMembers((list) => [...list, member]);

  const removeMember = (id: string) => {
    setMembers((list) => list.filter((m) => m.id !== id));
    setView({ kind: "list" });
  };

  // Décision de la propriétaire sur une demande. `decidedAt` = instant réel :
  // c'est le seul horodatage que l'on ne fige pas au 2026-09-03 du monde mock.
  const decideRequest = (id: string, status: "acceptee" | "refusee") =>
    setRequests((list) =>
      list.map((r) =>
        r.id === id ? { ...r, status, decidedAt: new Date().toISOString() } : r,
      ),
    );

  // La matrice vit dans Réglages depuis le 2026-09-27.
  const openPermissions = () => router.push("/reglages?section=autorisations");

  const selected =
    view.kind === "detail" ? members.find((m) => m.id === view.id) ?? null : null;

  // Rendez-vous non annulés du membre affiché, par jour — alimente l'alerte de
  // conflit quand la propriétaire s'apprête à accepter un congé. Matching par
  // prénom, comme l'écran Planning.
  const rdvDaysForSelected = useMemo(
    () =>
      selected
        ? rdvCountByStaffDay(scope)
            .filter((d) => d.staffFirstName === selected.firstName)
            .map(({ date, count }) => ({ date, count }))
        : [],
    [selected, scope],
  );

  if (view.kind === "new") {
    return (
      <div className="space-y-6">
        <div>
          <BackButton onClick={() => setView({ kind: "list" })} />
          <PageHeader title="Ajouter un membre" />
        </div>
        <div className="max-w-3xl">
          <AddMemberFlow
            allMembers={members}
            onCancel={() => setView({ kind: "list" })}
            onCreate={addMember}
            onDone={(id, invite) => {
              if (invite) patchMember(id, { account: "invited" });
              setView({ kind: "detail", id });
            }}
          />
        </div>
      </div>
    );
  }

  if (view.kind === "detail" && selected) {
    return (
      <MemberDetail
        member={selected}
        allMembers={members}
        requests={requests.filter((r) => r.memberId === selected.id)}
        rdvDays={rdvDaysForSelected}
        autorisations={autorisations}
        onBack={() => setView({ kind: "list" })}
        onPatch={(patch) => patchMember(selected.id, patch)}
        onDecideRequest={decideRequest}
        onOpenPermissions={openPermissions}
        onDelete={() => removeMember(selected.id)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Équipe"
        actions={
          tab === "membres" ? (
            <button
              type="button"
              onClick={() => setView({ kind: "new" })}
              className="btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] disabled:!bg-base-200 disabled:!text-base-content/40 gap-2"
            >
              <PlusIcon className="size-4" />
              Ajouter un membre
            </button>
          ) : tab === "pointage" ? (
            <SalonFilter value={scope} onChange={setScope} />
          ) : undefined
        }
      />
      <PageTabs
        label="Sections de l'équipe"
        tabs={[
          { href: "/equipe", label: "Membres", active: tab === "membres" },
          { href: "/equipe/planning", label: "Planning", active: tab === "planning" },
          { href: "/equipe/pointage", label: "Pointage", active: tab === "pointage" },
        ]}
      />

      {tab === "membres" ? (
        <EquipeList
          members={members}
          requests={requests}
          onOpen={(id) => setView({ kind: "detail", id })}
        />
      ) : tab === "pointage" ? (
        <PointageView />
      ) : (
        (() => {
          const modeSwitch = (
            <SegmentedToggle
              size="sm"
              value={planningMode}
              onChange={(v) => setPlanningMode(v as "horaires" | "rendez-vous")}
              aria-label="Affichage du planning"
              options={[
                { value: "horaires", label: "Horaires" },
                { value: "rendez-vous", label: "Rendez-vous" },
              ]}
            />
          );
          return planningMode === "horaires" ? (
            <ScheduleEditor modeSwitch={modeSwitch} />
          ) : (
            <PlanningBoard toolbarStart={modeSwitch} />
          );
        })()
      )}
    </div>
  );
}
