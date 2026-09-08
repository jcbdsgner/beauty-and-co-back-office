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

// Sous-vue « Autorisations » de l'écran Équipe — réglées PAR RÔLE.
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
      <Alert
        variant="info"
        title="Vos accès à vous ne changent pas"
        message={`${account.name} garde tous les accès. Ces autorisations s'appliquent aux comptes que vous invitez : chaque personne cumule les droits de ses rôles.`}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th
                scope="col"
                className="px-6 py-4 text-sm font-semibold text-gray-800"
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
                    className="w-40 px-4 py-4 text-center align-top"
                  >
                    <span className="block text-sm font-semibold text-gray-800">
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="mt-0.5 block text-theme-xs text-gray-400">
                      {count} accordée{count > 1 ? "s" : ""}
                      {dirty && " · modifié"}
                    </span>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => onReset(role)}
                        className="mt-1 text-theme-xs font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
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
      <tr className="bg-gray-50">
        <th
          scope="colgroup"
          colSpan={1 + ROLE_COLUMNS.length}
          className="px-6 py-2.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          {group.label}
        </th>
      </tr>
      {group.capabilities.map((cap) => (
        <tr key={cap.id} className="border-t border-gray-100">
          <th scope="row" className="px-6 py-3.5 font-normal">
            <span className="flex items-center gap-2 text-sm text-gray-800">
              {cap.label}
              {cap.sensitive && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[13px] font-medium text-gray-500">
                  <LockIcon className="size-3" />
                  Sensible
                </span>
              )}
            </span>
            {cap.hint && (
              <span className="mt-0.5 block text-theme-xs text-gray-500">
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
