"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  BoxIconLine,
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
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
import { Dropdown } from "../components/ui/dropdown/Dropdown";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

type NavGroup = { id: string; title: string; items: NavItem[] };

const menuGroups: NavGroup[] = [
  {
    id: "overview",
    title: "Vue d'ensemble",
    items: [
      { icon: <GridIcon />, name: "Dashboard", path: "/" },
      { icon: <UserCircleIcon />, name: "Mon espace", path: "/mon-espace" },
      { icon: <TaskIcon />, name: "Rapports", path: "/rapports" },
    ],
  },
  {
    id: "operations",
    title: "Opérations",
    items: [
      { icon: <ListIcon />, name: "Rendez-vous", path: "/rendez-vous" },
      { icon: <CalenderIcon />, name: "Calendrier", path: "/calendrier" },
      { icon: <GroupIcon />, name: "Clients", path: "/clients" },
      { icon: <ShootingStarIcon />, name: "Fidélité", path: "/fidelite" },
      { icon: <PieChartIcon />, name: "Satisfaction", path: "/satisfaction" },
      { icon: <ChatIcon />, name: "Messagerie", path: "/messagerie" },
    ],
  },
  {
    id: "catalogue",
    title: "Catalogue",
    items: [
      { icon: <TimeIcon />, name: "Créneaux horaires", path: "/creneaux-horaires" },
      {
        icon: <BoxCubeIcon />,
        name: "Services",
        subItems: [
          { name: "Gestion", path: "/services" },
          { name: "Prestations", path: "/services/prestations" },
          { name: "Questions", path: "/services/questions" },
        ],
      },
      {
        icon: <BoxIconLine />,
        name: "Inventaire",
        subItems: [{ name: "Recettes (conso.)", path: "/inventaire/recettes" }],
      },
    ],
  },
  {
    id: "team",
    title: "Équipe",
    items: [
      { icon: <GroupIcon />, name: "Équipe & Comptes", path: "/equipe" },
      { icon: <CalenderIcon />, name: "Planning", path: "/planning" },
    ],
  },
  {
    id: "settings",
    title: "Paramètres",
    items: [
      { icon: <FolderIcon />, name: "Salons", path: "/salons" },
      {
        icon: <EnvelopeIcon />,
        name: "Emails",
        subItems: [
          { name: "Modèles", path: "/emails/modeles" },
          { name: "Composer", path: "/emails/composer" },
        ],
      },
      { icon: <DollarLineIcon />, name: "Paiement", path: "/paiement" },
    ],
  },
];

const LOCATIONS = ["Toutes les locations", "ALMADIES", "SEA PLAZA"];

function LocationSelector({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(LOCATIONS[0]);

  if (collapsed) {
    return (
      <div className="mb-6 flex justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400">
          <FolderIcon />
        </span>
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="dropdown-toggle flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="truncate">{value}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <Dropdown isOpen={open} onClose={() => setOpen(false)} className="left-0 w-full p-1.5">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => {
              setValue(loc);
              setOpen(false);
            }}
            className={`block w-full rounded-lg px-3 py-2 text-left text-theme-sm hover:bg-gray-100 ${
              loc === value ? "font-medium text-gray-800" : "text-gray-600"
            }`}
          >
            {loc}
          </button>
        ))}
      </Dropdown>
    </div>
  );
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const showText = isExpanded || isHovered || isMobileOpen;
  const collapsed = !isExpanded && !isHovered && !isMobileOpen;

  const [openSubmenu, setOpenSubmenu] = useState<{ groupId: string; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let matched = false;
    menuGroups.forEach((group) => {
      group.items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ groupId: group.id, index });
            matched = true;
          }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.groupId}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, groupId: string) => {
    setOpenSubmenu((prev) =>
      prev && prev.groupId === groupId && prev.index === index ? null : { groupId, index },
    );
  };

  const renderMenuItems = (items: NavItem[], groupId: string) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const open = openSubmenu?.groupId === groupId && openSubmenu?.index === index;
        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, groupId)}
                className={`menu-item group ${open ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${
                  collapsed ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span className={open ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                  {nav.icon}
                </span>
                {showText && <span className="menu-item-text">{nav.name}</span>}
                {showText && (
                  <ChevronDownIcon
                    className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                      open ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                  aria-current={isActive(nav.path) ? "page" : undefined}
                >
                  <span
                    className={
                      isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }
                  >
                    {nav.icon}
                  </span>
                  {showText && <span className="menu-item-text">{nav.name}</span>}
                </Link>
              )
            )}
            {nav.subItems && showText && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${groupId}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{ height: open ? `${subMenuHeight[`${groupId}-${index}`]}px` : "0px" }}
              >
                <ul className="ml-9 mt-2 space-y-1">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-6 ${collapsed ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            B&amp;C
          </span>
          {showText && (
            <span className="text-lg font-bold text-gray-900">
              Beauty<span className="text-brand-500">AndCo</span>
            </span>
          )}
        </Link>
      </div>

      <LocationSelector collapsed={collapsed} />

      <div className="flex flex-1 flex-col overflow-y-auto pb-6 no-scrollbar">
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
                {renderMenuItems(group.items, group.id)}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
