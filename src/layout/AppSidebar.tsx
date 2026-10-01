"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import UserDropdown from "@/components/header/UserDropdown";
import {
  CalendarCheck2,
  FileUser,
  Gift,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  Sparkles,
  UserRoundGroup,
} from "lucide-react";

type NavItem = { name: string; icon: React.ReactNode; path: string };

// Rapports, Satisfaction, Journal et Salons ne sont plus dans la sidebar
// (2026-09-21) : ce sont des écrans de consultation occasionnelle ou déjà
// accessibles ailleurs (Salons → menu compte du header). Ils restent
// atteignables via des raccourcis sur le tableau de bord (Rapports,
// Satisfaction, Journal) et le menu compte (Salons) — voir Dashboard.tsx.
// Stock, retiré le 2026-09-27, y est revenu le 2026-09-28 (entre Services et
// Fidélité).
const menuItems: NavItem[] = [
  { icon: <LayoutDashboard />, name: "Tableau de bord", path: "/" },
  { icon: <CalendarCheck2 />, name: "Rendez-vous", path: "/rendez-vous" },
  { icon: <MessageCircle />, name: "Messagerie", path: "/messagerie" },
  { icon: <FileUser />, name: "Clients", path: "/clients" },
  { icon: <UserRoundGroup />, name: "Équipe", path: "/equipe" },
  { icon: <Sparkles />, name: "Services", path: "/services" },
  { icon: <Package />, name: "Stock", path: "/stock" },
  { icon: <Gift />, name: "Fidélité", path: "/fidelite" },
  { icon: <Settings />, name: "Réglages", path: "/reglages" },
];

// Sidebar du Figma « Point de vente » (node 381:497, remise le 2026-09-27 à la
// place du rail 104px de point-de-vente, sur demande) : 260px, toujours
// dépliée, wordmark centré au-dessus d'un séparateur, un lien icône 18px +
// libellé 16px par module, actif en pastille pleine `#886666`. Le placeholder
// texte du Figma est rendu par le vrai wordmark SVG de la marque.
const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#efe9e8] bg-white px-5 drop-shadow-[1px_0px_1px_rgba(0,0,0,0.04)] print:hidden">
      <div className="flex shrink-0 items-center justify-center border-b border-[#efe9e8] py-5">
        <Link href="/" aria-label="Beauty & Co — tableau de bord" className="flex items-center">
          <Image
            src="/images/logo/beautyandco-wordmark.svg"
            alt="Beauty & Co"
            width={497}
            height={230}
            priority
            className="h-11 w-[95px] object-contain"
          />
        </Link>
      </div>

      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-4 pb-6">
        {menuItems.map((nav) => {
          const active = isActive(nav.path);
          return (
            <Link
              key={nav.name}
              href={nav.path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-[16px] leading-[22px] font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.08)]"
                  : "text-[#6a6060] hover:bg-accent hover:text-secondary",
              )}
            >
              <span className="flex size-[18px] shrink-0 items-center justify-center [&>svg]:size-[18px]">
                {nav.icon}
              </span>
              {nav.name}
            </Link>
          );
        })}
      </nav>

      {/* Compte de la propriétaire en pied de sidebar (2026-09-28 : plus de
          barre du haut, comme le rail de point-de-vente). */}
      <div className="shrink-0 border-t border-[#efe9e8] py-4">
        <UserDropdown />
      </div>
    </aside>
  );
};

export default AppSidebar;
