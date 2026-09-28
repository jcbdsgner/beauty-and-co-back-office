"use client";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings, Store } from "lucide-react";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import { Avatar } from "@/components/ui/atoms/avatar";
import { useAccount } from "@/context/AccountContext";
import { accountInitials } from "@/lib/mock/compte";

// Menu compte — `DropdownMenu` Radix de point-de-vente (en-tête nom + rôle,
// puis actions), déclenché par la pastille avatar + nom + rôle, en pied de
// sidebar (le menu s'ouvre vers le haut).
export default function UserDropdown() {
  const { account } = useAccount();
  const router = useRouter();
  // Radix génère l'id du déclencheur avec useId, qui ne coïncide pas entre le
  // rendu serveur et le client dans ce shell : pastille statique au SSR, menu
  // Radix une fois hydraté (même rendu visuel, pas de décalage).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const trigger = (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg py-2 pr-3 pl-2 text-left text-base-content/80 transition hover:bg-accent"
    >
      <Avatar
        photoUrl={account.avatarUrl || null}
        initial={accountInitials(account.name)}
        size={40}
        className="bg-accent text-sm font-semibold text-secondary"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-base-content">{account.name}</span>
        <span className="block truncate text-xs text-base-content/60">{account.role}</span>
      </span>
      <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-base-content/45" />
    </button>
  );

  if (!hydrated) return trigger;

  return (
    <DropdownMenu
      align="start"
      side="top"
      trigger={trigger}
      items={[
        { type: "header", label: account.name, sublabel: account.role },
        { type: "separator" },
        { label: "Mon compte", icon: <Settings className="size-4" />, onSelect: () => router.push("/compte") },
        { label: "Paramètres des salons", icon: <Store className="size-4" />, onSelect: () => router.push("/salons") },
        { type: "separator" },
        { label: "Se déconnecter", icon: <LogOut className="size-4" />, onSelect: () => router.push("/signin") },
      ]}
    />
  );
}
