"use client";

import Alert from "@/components/ui/alert/Alert";
import { LockIcon } from "@/icons";
import { useAccount } from "@/context/AccountContext";
import { ROLE_LABELS } from "@/lib/mock/staff";
import {
  CAPABILITY_GROUPS,
  ROLE_COLUMNS,
  roleDiffersFromDefault,
  roleGrantedCount,
  type Autorisations,
  type Capability,
} from "@/lib/mock/autorisations";
import { Toggle } from "./ui";

// Réglages › Autorisations (sortie de l'écran Équipe le 2026-09-27) — réglées PAR RÔLE.
//
// 1. Sokhna arrive ici rarement, à froid, souvent après s'être demandé « est-ce
//    que ma manager peut changer un prix ? » ou après un incident. Registre posé,
//    libellés sans jargon.
// 2. Ce qui saute aux yeux : pour chaque rôle, ce qu'il peut faire — surtout la
//    colonne Manager, la plus large, avec les quelques cases volontairement
//    décochées (prix, recettes, paiement). Et le rappel qu'elle, elle a tout.
// 3. Quand ça se passe mal : rôle sans aucune case → avertissement ; rappel que
//    ces réglages ne concernent que les personnes qui ont un compte.

type Props = {
  autorisations: Autorisations;
  onChange: (
    role: (typeof ROLE_COLUMNS)[number],
    cap: Capability,
    value: boolean,
  ) => void;
  onReset: (role: (typeof ROLE_COLUMNS)[number]) => void;
};

export default function RolePermissions({ autorisations, onChange, onReset }: Props) {
  const { account } = useAccount();

  const emptyRoles = ROLE_COLUMNS.filter(
    (role) => roleGrantedCount(role, autorisations) === 0,
  );

  return (
    <div className="space-y-5">
      <p className="max-w-[72ch] text-[15px] leading-relaxed text-base-content/70">
        Ces autorisations s&apos;appliquent aux comptes que vous invitez : chaque personne cumule
        les droits de ses rôles. Vos accès à vous ne changent pas — {account.name} garde tous les
        accès.
      </p>

      <div className="overflow-hidden rounded-box border border-base-300 bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-base-300">
              <th
                scope="col"
                className="px-6 py-4 text-sm font-semibold text-base-content"
              >
                Autorisation
              </th>
              {ROLE_COLUMNS.map((role) => {
                const count = roleGrantedCount(role, autorisations);
                const dirty = roleDiffersFromDefault(role, autorisations);
                return (
                  <th
                    scope="col"
                    key={role}
                    className="w-36 px-4 py-4 text-center align-top"
                  >
                    <span className="block text-sm font-semibold text-base-content">
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="mt-0.5 block text-xs text-base-content/45">
                      {count} accordée{count > 1 ? "s" : ""}
                      {dirty && " · modifié"}
                    </span>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => onReset(role)}
                        className="mt-1 text-xs font-medium text-brand-600 transition hover:text-secondary hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {CAPABILITY_GROUPS.map((group) => (
              <GroupRows
                key={group.id}
                group={group}
                autorisations={autorisations}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {emptyRoles.map((role) => (
        <Alert
          key={role}
          variant="warning"
          title={`Le rôle « ${ROLE_LABELS[role]} » ne peut rien faire`}
          message="Aucune autorisation n'est cochée : une personne qui n'a que ce rôle n'aura accès à rien sur la plateforme."
        />
      ))}
    </div>
  );
}

function GroupRows({
  group,
  autorisations,
  onChange,
}: {
  group: (typeof CAPABILITY_GROUPS)[number];
  autorisations: Autorisations;
  onChange: Props["onChange"];
}) {
  return (
    <>
      <tr className="border-t border-base-300 bg-base-200/60">
        <th
          scope="colgroup"
          colSpan={1 + ROLE_COLUMNS.length}
          className="px-6 py-2 text-[13px] font-medium text-base-content/55"
        >
          {group.label}
        </th>
      </tr>
      {group.capabilities.map((cap) => (
        <tr key={cap.id} className="border-t border-base-300">
          <th scope="row" className="px-6 py-3.5 font-normal">
            <span className="flex items-center gap-2 text-[15px] text-base-content">
              {cap.label}
              {cap.sensitive && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[13px] font-medium text-base-content/60">
                  <LockIcon className="size-3" />
                  Sensible
                </span>
              )}
            </span>
            {cap.hint && (
              <span className="mt-0.5 block text-xs text-base-content/60">
                {cap.hint}
              </span>
            )}
          </th>
          {ROLE_COLUMNS.map((role) => (
            <td key={role} className="px-4 py-3.5 text-center">
              <div className="flex justify-center">
                <Toggle
                  checked={autorisations[role][cap.id]}
                  onChange={(value) => onChange(role, cap.id, value)}
                  aria-label={`${cap.label} — ${ROLE_LABELS[role]}`}
                />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
