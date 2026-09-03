"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type Notif = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: "info" | "success" | "warning";
};

const NOTIFS: Notif[] = [
  {
    id: "n1",
    title: "Nouveau rendez-vous",
    detail: "Awa Diop — Coupe & Brushing, salon Almadies à 09:00",
    meta: "il y a 5 min",
    tone: "info",
  },
  {
    id: "n2",
    title: "Stock bas",
    detail: "Teinture Majirel 6.0 : 4 unités restantes (seuil 10)",
    meta: "il y a 40 min",
    tone: "warning",
  },
  {
    id: "n3",
    title: "Paiement encaissé",
    detail: "Fatou Ndiaye — 25 000 FCFA, salon Sea Plaza",
    meta: "il y a 1 h",
    tone: "success",
  },
  {
    id: "n4",
    title: "Annulation",
    detail: "Rama Diallo a annulé son RDV de 13:00 (Soin visage)",
    meta: "il y a 2 h",
    tone: "warning",
  },
  {
    id: "n5",
    title: "Nouvel avis client",
    detail: "Khady Guèye a laissé un avis 5/5 sur le salon Almadies",
    meta: "hier",
    tone: "success",
  },
];

const DOT: Record<Notif["tone"], string> = {
  info: "bg-blue-light-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const handleClick = () => {
    setIsOpen((v) => !v);
    setNotifying(false);
  };

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        onClick={handleClick}
        aria-label="Notifications"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            notifying ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        </span>
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[200px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
          <h5 className="text-lg font-semibold text-gray-800">Notifications</h5>
          <button
            onClick={() => setIsOpen(false)}
            className="dropdown-toggle text-gray-500 transition hover:text-gray-700"
            aria-label="Fermer"
          >
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col overflow-y-auto custom-scrollbar">
          {NOTIFS.map((n) => (
            <li key={n.id}>
              <DropdownItem
                onItemClick={() => setIsOpen(false)}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.tone]}`} />
                <span className="block">
                  <span className="mb-0.5 block text-theme-sm font-medium text-gray-800">{n.title}</span>
                  <span className="mb-1 block text-theme-sm text-gray-500">{n.detail}</span>
                  <span className="block text-theme-xs text-gray-400">{n.meta}</span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        <Link
          href="/notifications"
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Voir toutes les notifications
        </Link>
      </Dropdown>
    </div>
  );
}
