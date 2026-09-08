"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  BoxIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  EnvelopeIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  ShootingStarIcon,
  TaskIcon,
  TimeIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = { name: string; icon: React.ReactNode; path: string };
type NavGroup = { id: string; title: string; items: NavItem[] };

const menuGroups: NavGroup[] = [
  {
    id: "pilotage",
    title: "Pilotage",
    items: [
      { icon: <GridIcon />, name: "Tableau de bord", path: "/" },
      { icon: <TaskIcon />, name: "Rapports", path: "/rapports" },
      { icon: <PieChartIcon />, name: "Satisfaction", path: "/satisfaction" },
    ],
  },
  {
    id: "journee",
    title: "Journée",
    items: [
      { icon: <ListIcon />, name: "Rendez-vous", path: "/rendez-vous" },
      { icon: <ChatIcon />, name: "Messagerie", path: "/messagerie" },
      { icon: <GroupIcon />, name: "Clients", path: "/clients" },
    ],
  },
  {
    id: "equipe",
    title: "Équipe",
    items: [
      { icon: <UserCircleIcon />, name: "Équipe", path: "/equipe" },
      { icon: <TimeIcon />, name: "Planning", path: "/planning" },
      { icon: <DocsIcon />, name: "Journal", path: "/journal" },
    ],
  },
  {
    id: "catalogue",
    title: "Catalogue & stock",
    items: [
      { icon: <BoxCubeIcon />, name: "Services", path: "/services" },
      { icon: <BoxIcon />, name: "Stock", path: "/stock" },
    ],
  },
  {
    id: "configuration",
    title: "Configuration",
    items: [
      { icon: <FolderIcon />, name: "Salons", path: "/salons" },
      { icon: <ShootingStarIcon />, name: "Fidélité & abonnements", path: "/fidelite" },
      { icon: <EnvelopeIcon />, name: "Emails", path: "/emails/modeles" },
      { icon: <DollarLineIcon />, name: "Paiement", path: "/paiement" },
    ],
  },
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
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 print:hidden
        ${isExpanded || isMobileOpen ? "w-[240px]" : isHovered ? "w-[240px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-6 ${collapsed ? "lg:justify-center" : "justify-start"}`}>
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
              className="h-14 w-auto"
            />
          ) : (
            <Image
              src="/images/logo/beautyandco-mark.jpg"
              alt="Beauty & Co"
              width={1200}
              height={1197}
              priority
              className="h-11 w-11 object-contain"
            />
          )}
        </Link>
      </div>

      <div className="mt-2 flex flex-1 flex-col overflow-y-auto pb-6 no-scrollbar">
        <nav>
          <div className="flex flex-col gap-4">
            {menuGroups.map((group) => (
              <div key={group.id}>
                <h2
                  className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                    collapsed ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {showText ? group.title : <HorizontaLDots />}
                </h2>
                <ul className="flex flex-col gap-4">
                  {group.items.map((nav) => {
                    const active = isActive(nav.path);
                    return (
                      <li key={nav.name}>
                        <Link
                          href={nav.path}
                          className={`menu-item group ${
                            active ? "menu-item-active" : "menu-item-inactive"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={
                              active ? "menu-item-icon-active" : "menu-item-icon-inactive"
                            }
                          >
                            {nav.icon}
                          </span>
                          {showText && <span className="menu-item-text">{nav.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
