"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
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

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const showText = isExpanded || isHovered || isMobileOpen;
  const collapsed = !isExpanded && !isHovered && !isMobileOpen;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-[#efe9e8] bg-white px-3 text-gray-900 shadow-[1px_0_2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out lg:mt-0 print:hidden
        ${isExpanded || isMobileOpen ? "w-[260px] px-5" : isHovered ? "w-[260px] px-5" : "w-[80px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex items-center border-b border-[#efe9e8] py-5 ${collapsed ? "lg:justify-center" : "justify-center"}`}
      >
        <Link
          href="/"
          aria-label="Beauty & Co — tableau de bord"
          className="flex items-center"
        >
          {showText ? (
            <Image
              src="/images/logo/beautyandco-wordmark.svg"
              alt="Beauty & Co"
              width={497}
              height={230}
              priority
              className="h-11 w-auto"
            />
          ) : (
            <Image
              src="/images/logo/beautyandco-mark.jpg"
              alt="Beauty & Co"
              width={1200}
              height={1197}
              priority
              className="h-11 w-11 rounded-full object-contain ring-2 ring-white shadow-[var(--shadow-card)]"
            />
          )}
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col overflow-y-auto pb-6 no-scrollbar">
        <nav>
          <ul className="flex flex-col gap-2">
            {menuItems.map((nav) => {
              const active = isActive(nav.path);
              return (
                <li key={nav.name}>
                  <Link
                    href={nav.path}
                    className={`group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                      collapsed ? "mx-auto h-11 w-11 justify-center px-0" : "px-4 py-3"
                    } ${
                      active
                        ? "bg-brand-500 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-[#6a6060] hover:bg-brand-50/70 hover:text-brand-700"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px] ${
                        active ? "text-white" : "text-[#6a6060] group-hover:text-brand-600"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {showText && <span className="whitespace-nowrap">{nav.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
