"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { PlusIcon } from "@/icons";
import { useLocation } from "@/context/LocationContext";
import { usePlanningData } from "@/context/PlanningContext";
import {
  members as memberSeeds,
  type Member,
  type StaffRole,
} from "@/lib/mock/staff";
import { rdvCountByStaffDay } from "@/lib/mock/rendezvous";
import { staffRequests as requestSeeds, type StaffRequest } from "@/lib/mock/rh";
import {
  applyCapability,
  defaultAutorisations,
  type Autorisations,
  type Capability,
} from "@/lib/mock/autorisations";
import EquipeList from "./equipe/EquipeList";
import MemberDetail from "./equipe/MemberDetail";
import AddMemberFlow from "./equipe/AddMemberFlow";
import RolePermissions from "./equipe/RolePermissions";
import PlanningPanel from "./equipe/PlanningPanel";
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

type Tab = "membres" | "planning" | "autorisations";

const TAB_OPTIONS: SegmentedOption<Tab>[] = [
  { value: "membres", label: "Membres" },
  { value: "planning", label: "Planning" },
  { value: "autorisations", label: "Autorisations" },
];

type View = { kind: "list" } | { kind: "detail"; id: string } | { kind: "new" };

export default function Equipe() {
  const { scope } = useLocation();
  const searchParams = useSearchParams();

  // Aucun backend : tout est édité en mémoire de session (comme Services / Fidélité).
  const [members, setMembers] = useState<Member[]>(memberSeeds);
  const [requests, setRequests] = useState<StaffRequest[]>(requestSeeds);
  const [autorisations, setAutorisations] =
    useState<Autorisations>(defaultAutorisations);
  // Onglet Planning : état partagé via `PlanningContext` (pas local à cet
  // écran) — l'action rapide « marquer absente aujourd'hui » de l'agenda
  // `/rendez-vous` doit voir et modifier la même donnée.
  const { absences, setAbsences, overrides, setOverrides } = usePlanningData();
  const [view, setView] = useState<View>({ kind: "list" });
  const [tab, setTab] = useState<Tab>("membres");

  // Arrivée depuis une notification « demande en attente » : ?membre=<id> ouvre
  // directement la fiche — y compris si la propriétaire est déjà sur /equipe et
  // clique la notif (le param change sans remontage). Ajustement d'état pendant
  // le rendu, même motif que l'ouverture de `AbsenceDialog` sur une cellule.
  // Id inconnu → ignoré, on reste sur la liste.
  const memberParam = searchParams.get("membre");
  const [lastMemberParam, setLastMemberParam] = useState<string | null>(null);
  if (memberParam !== lastMemberParam) {
    setLastMemberParam(memberParam);
    if (memberParam && memberSeeds.some((m) => m.id === memberParam)) {
      setView({ kind: "detail", id: memberParam });
    }
  }

  // Arrivée depuis un lien externe (ex. Journal, fiche membre) avec
  // ?vue=planning : ouvre directement l'onglet Planning, même motif que
  // `?membre=` ci-dessus.
  const vueParam = searchParams.get("vue");
  const [lastVueParam, setLastVueParam] = useState<string | null>(null);
  if (vueParam !== lastVueParam) {
    setLastVueParam(vueParam);
    if (vueParam === "planning") {
      setTab("planning");
      setView({ kind: "list" });
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

  // Autorisations par rôle — éditées en mémoire de session. `applyCapability`
  // propage la cascade des prérequis (cocher un dérivé coche son prérequis,
  // décocher un prérequis décoche ses dérivés).
  const setRoleCapability = (role: StaffRole, cap: Capability, value: boolean) =>
    setAutorisations((current) => ({
      ...current,
      [role]: applyCapability(current[role], cap, value),
    }));

  const resetRole = (role: StaffRole) =>
    setAutorisations((current) => ({
      ...current,
      [role]: { ...defaultAutorisations[role] },
    }));

  const openPermissions = () => {
    setTab("autorisations");
    setView({ kind: "list" });
  };

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
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Équipe"
          actions={
            tab === "membres" ? (
              <button
                type="button"
                onClick={() => setView({ kind: "new" })}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <PlusIcon className="size-4" />
                Ajouter un membre
              </button>
            ) : undefined
          }
        />
        <SegmentedControl
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
          aria-label="Membres, planning ou autorisations"
        />
      </div>

      {tab === "membres" ? (
        <EquipeList
          members={members}
          requests={requests}
          onOpen={(id) => setView({ kind: "detail", id })}
        />
      ) : tab === "planning" ? (
        <PlanningPanel
          absences={absences}
          setAbsences={setAbsences}
          overrides={overrides}
          setOverrides={setOverrides}
        />
      ) : (
        <RolePermissions
          autorisations={autorisations}
          onChange={setRoleCapability}
          onReset={resetRole}
        />
      )}
    </div>
  );
}
