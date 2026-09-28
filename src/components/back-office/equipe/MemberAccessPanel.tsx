"use client";

import { useState } from "react";
import { CheckLineIcon } from "@/icons";
import type { AccountState, Member } from "@/lib/mock/staff";
import { ROLE_LABELS, fullName } from "@/lib/mock/staff";
import {
  CAPABILITY_GROUPS,
  capabilitiesForRoles,
  type Autorisations,
} from "@/lib/mock/autorisations";
import { btnGhost, btnPrimary } from "./ui";

type Props = {
  member: Member;
  // Autorisations par rôle (état de session, `AutorisationsContext`).
  autorisations: Autorisations;
  onChange: (account: AccountState) => void;
  // Ouvre Réglages › Autorisations (matrice par rôle).
  onOpenPermissions: () => void;
};

export default function MemberAccessPanel({
  member,
  autorisations,
  onChange,
  onOpenPermissions,
}: Props) {
  const [resent, setResent] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const email = member.email || "—";

  // Autorisations effectives = union des rôles du membre.
  const granted = capabilitiesForRoles(member.roles, autorisations);
  const grantedGroups = CAPABILITY_GROUPS.map((group) => ({
    label: group.label,
    items: group.capabilities.filter((c) => granted.has(c.id)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="rounded-box border border-base-300 bg-white p-6">
        {member.account === "none" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-base-content">Aucun compte</p>
              <p className="mt-1 text-sm text-base-content/60">
                {fullName(member)} n&apos;a pas encore accès à la plateforme. L&apos;invitation
                est envoyée à <span className="font-medium text-base-content/80">{email}</span>.
              </p>
            </div>
            <button
              type="button"
              className={btnPrimary}
              disabled={!member.email}
              onClick={() => onChange("invited")}
            >
              Inviter par e-mail
            </button>
            {!member.email && (
              <p className="text-xs text-warning-600">
                Renseignez d&apos;abord une adresse e-mail dans l&apos;onglet « Identité ».
              </p>
            )}
          </div>
        )}

        {member.account === "invited" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-base-content">Invitation envoyée</p>
              <p className="mt-1 text-sm text-base-content/60">
                En attente de la première connexion de{" "}
                <span className="font-medium text-base-content/80">{email}</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => setResent(true)}
              >
                Renvoyer l&apos;invitation
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-error-600 transition hover:bg-error-50"
                onClick={() => {
                  setResent(false);
                  onChange("none");
                }}
              >
                Annuler l&apos;invitation
              </button>
            </div>
            {resent && (
              <p className="text-xs font-medium text-success-600">
                Invitation renvoyée à {email}.
              </p>
            )}
          </div>
        )}

        {member.account === "active" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-base-content">Compte actif</p>
              <p className="mt-1 text-sm text-base-content/60">
                {fullName(member)} se connecte avec{" "}
                <span className="font-medium text-base-content/80">{email}</span>.
              </p>
            </div>
            {confirmRevoke ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-base-content/60">
                  Révoquer l&apos;accès ? La personne ne pourra plus se connecter ; son
                  historique est conservé.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmRevoke(false);
                    onChange("none");
                  }}
                  className="font-semibold text-error-600 hover:underline"
                >
                  Révoquer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRevoke(false)}
                  className="font-medium text-base-content/60 hover:underline"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-base-300 px-4 py-2.5 text-sm font-medium text-base-content/70 transition hover:border-error-200 hover:bg-error-50 hover:text-error-600"
                onClick={() => setConfirmRevoke(true)}
              >
                Révoquer l&apos;accès
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ce que ce membre peut faire — dérivé de ses rôles et de la matrice
          d'autorisations (Réglages › Autorisations). */}
      <div className="rounded-box border border-base-300 bg-white">
        <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-base-content">
              Ce que ce membre peut faire
            </h3>
            <p className="mt-0.5 text-xs text-base-content/60">
              {member.roles.length > 0
                ? `D'après ${
                    member.roles.length > 1 ? "les rôles" : "le rôle"
                  } ${member.roles.map((r) => ROLE_LABELS[r]).join(" + ")}.`
                : "Aucun rôle attribué."}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPermissions}
            className="shrink-0 text-sm font-medium text-brand-600 transition hover:text-secondary hover:underline"
          >
            Régler les autorisations par rôle
          </button>
        </div>

        <div className="px-6 py-5">
          {member.roles.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Attribuez au moins un rôle dans l&apos;onglet « Identité » pour lui
              donner des autorisations.
            </p>
          ) : grantedGroups.length === 0 ? (
            <p className="text-sm text-base-content/60">
              {member.roles.length > 1 ? "Ces rôles n'ont" : "Ce rôle n'a"} aucune
              autorisation. Une personne qui n&apos;a que{" "}
              {member.roles.length > 1 ? "ces rôles" : "ce rôle"} n&apos;aura accès à
              rien.
            </p>
          ) : (
            <div className="space-y-4">
              {grantedGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/45">
                    {group.label}
                  </p>
                  <ul className="space-y-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm text-base-content/80"
                      >
                        <CheckLineIcon className="mt-0.5 size-4 shrink-0 text-brand-500" />
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {member.roles.length > 0 &&
            grantedGroups.length > 0 &&
            member.account !== "active" && (
              <p className="mt-5 rounded-lg bg-base-200 px-3 py-2 text-xs text-base-content/60">
                Ces autorisations ne s&apos;appliqueront qu&apos;une fois l&apos;accès
                à la plateforme activé.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
