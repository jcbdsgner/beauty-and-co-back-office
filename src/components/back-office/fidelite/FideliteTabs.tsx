import PageTabs from "../PageTabs";

// Onglets de Fidélité (2026-10-05) : le suivi des abonnements & packs, et
// celui des cartes cadeaux — deux routes.
export default function FideliteTabs({ active }: { active: "abonnements" | "cartes-cadeaux" }) {
  return (
    <PageTabs
      label="Sections de Fidélité"
      tabs={[
        { href: "/fidelite", label: "Abonnements & packs", active: active === "abonnements" },
        { href: "/fidelite/cartes-cadeaux", label: "Cartes cadeaux", active: active === "cartes-cadeaux" },
      ]}
    />
  );
}
