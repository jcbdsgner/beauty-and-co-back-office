"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { salonName } from "@/lib/mock/beautyandco";
import {
  ACCOUNT_LABELS,
  CATEGORY_LABELS,
  ROLE_LABELS,
  fullName,
  initials,
  type AccountState,
  type Member,
} from "@/lib/mock/staff";
import type { StaffRequest } from "@/lib/mock/rh";
import type { Autorisations } from "@/lib/mock/autorisations";
import type { IdentityDraft } from "./MemberIdentityFields";
import MemberActivityPanel from "./MemberActivityPanel";
import MemberIdentityForm from "./MemberIdentityForm";
import MemberAccessPanel from "./MemberAccessPanel";
import MemberSkillsPanel from "./MemberSkillsPanel";
import MemberSchedulePanel from "./MemberSchedulePanel";
import { Avatar, BackButton } from "./ui";

// Fiche membre — 3 onglets :
//  · Activité (défaut) : note de satisfaction client + commentaires, charge de
//    rendez-vous, et le bloc « Demandes » (bandeau de décision avance / congé +
//    historique daté). C'est l'état de la personne, pas sa config.
//  · Identité & accès : coordonnées / métier / rôles / salons + membre actif,
//    puis accès à la plateforme et récap des autorisations par rôle.
//  · Compétences & horaires : prestations réalisées + trame hebdomadaire.

type TabId = "activite" | "identite" | "competences";

type Props = {
  member: Member;
  allMembers: Member[];
  // Demandes de CE membre (avance / congé), tenues en état de session par l'écran.
  requests: StaffRequest[];
  // Rendez-vous non annulés du membre, par jour ISO — alerte de conflit congé +
  // compteur « à venir » de l'onglet Activité.
  rdvDays: { date: string; count: number }[];
  // Autorisations par rôle (état de session) — pour le récap « ce que ce membre
  // peut faire » de l'onglet « Identité & accès ».
  autorisations: Autorisations;
  onBack: () => void;
  onPatch: (patch: Partial<Member>) => void;
  onDecideRequest: (id: string, status: "acceptee" | "refusee") => void;
  // Bascule l'écran Équipe sur la sous-vue « Autorisations ».
  onOpenPermissions: () => void;
  onDelete: () => void;
};

const ACCOUNT_TONE: Record<AccountState, "success" | "info" | "light"> = {
  active: "success",
  invited: "info",
  none: "light",
};

export default function MemberDetail({
  member,
  allMembers,
  requests,
  rdvDays,
  autorisations,
  onBack,
  onPatch,
  onDecideRequest,
  onOpenPermissions,
  onDelete,
}: Props) {
  const [tab, setTab] = useState<TabId>("activite");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pendingCount = requests.filter((r) => r.status === "en_attente").length;

  const tabs: { id: TabId; label: React.ReactNode }[] = [
    {
      id: "activite",
      label: (
        <span className="inline-flex items-center gap-1.5">
          Activité
          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-500 px-1 text-[12px] font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </span>
      ),
    },
    { id: "identite", label: "Identité & accès" },
    { id: "competences", label: `Compétences & horaires · ${member.skills.length}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Avatar initials={initials(member)} size="lg" />
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                {fullName(member)}
                {!member.active && (
                  <Badge size="sm" color="light">
                    Inactif
                  </Badge>
                )}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-theme-sm text-gray-500">
                  {CATEGORY_LABELS[member.category]}
                </span>
                <span className="text-gray-300">·</span>
                {member.roles.map((r) => (
                  <Badge key={r} size="sm" color="primary">
                    {ROLE_LABELS[r]}
                  </Badge>
                ))}
                <span className="text-gray-300">·</span>
                <Badge size="sm" color={ACCOUNT_TONE[member.account]}>
                  {ACCOUNT_LABELS[member.account]}
                </Badge>
                <span className="text-gray-300">·</span>
                <span className="text-theme-sm text-gray-500">
                  {member.salonIds.map((s) => salonName(s)).join(", ") || "aucun salon"}
                </span>
              </div>
            </div>
          </div>

          {confirmDelete ? (
            <div className="flex max-w-sm items-center gap-2 text-theme-sm">
              <span className="text-gray-500">
                Supprimer définitivement ce membre ? À réserver aux erreurs de saisie —
                sinon, désactivez-le pour garder son historique.
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="shrink-0 font-semibold text-error-600 hover:underline"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="shrink-0 font-medium text-gray-500 hover:underline"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-theme-xs font-medium text-gray-400 transition hover:text-error-600"
            >
              Supprimer définitivement
            </button>
          )}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Sections de la fiche membre"
        className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1"
      >
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-theme-sm font-medium transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className={tab === "activite" ? "max-w-4xl" : "max-w-3xl"}>
        {tab === "activite" && (
          <MemberActivityPanel
            member={member}
            requests={requests}
            rdvDays={rdvDays}
            onDecideRequest={onDecideRequest}
          />
        )}

        {tab === "identite" && (
          <div className="space-y-6">
            <MemberIdentityForm
              member={member}
              onSave={(identity: IdentityDraft) => onPatch(identity)}
              onSetActive={(active) => onPatch({ active })}
            />
            <MemberAccessPanel
              member={member}
              autorisations={autorisations}
              onChange={(account) => onPatch({ account })}
              onOpenPermissions={onOpenPermissions}
            />
          </div>
        )}

        {tab === "competences" && (
          <div className="space-y-8">
            <MemberSkillsPanel
              member={member}
              allMembers={allMembers}
              onChange={(skills) => onPatch({ skills })}
            />
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Horaires habituels</h2>
                <p className="mt-1 text-theme-sm text-gray-500">
                  La trame appliquée chaque semaine par le Planning.
                </p>
              </div>
              <MemberSchedulePanel
                baseHours={member.baseHours}
                onChange={(baseHours) => onPatch({ baseHours })}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
