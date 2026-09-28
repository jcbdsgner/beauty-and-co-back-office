"use client";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, Store } from "lucide-react";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import { Avatar } from "@/components/ui/atoms/avatar";
import { useAccount } from "@/context/AccountContext";
import { accountInitials } from "@/lib/mock/compte";

// Menu compte — `DropdownMenu` Radix de point-de-vente (en-tête nom + rôle,
// puis actions), déclenché par la pastille avatar + nom.
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
      className="flex items-center gap-3 rounded-box py-1.5 pr-3 pl-1.5 text-base-content/80 transition hover:bg-base-100"
    >
      <Avatar
        photoUrl={account.avatarUrl || null}
        initial={accountInitials(account.name)}
        size={40}
        className="bg-accent text-sm font-semibold text-secondary"
      />
      <span className="text-sm font-semibold">{account.name}</span>
      <ChevronDown aria-hidden className="size-4 text-base-content/45" />
    </button>
  );

  if (!hydrated) return trigger;

  return (
    <DropdownMenu
      align="end"
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
