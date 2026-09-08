"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useNotifications } from "@/context/NotificationsContext";
import { CATEGORY_LABELS, TONE_DOT } from "@/lib/mock/notifications";

// Repère « aujourd'hui » figé, cohérent avec le reste des fixtures.
const TODAY = "2026-09-03";

// « à l'instant » / « il y a 2 h » / « hier » / « 1 sept. »
function relative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date(`${TODAY}T13:20:00`).getTime();
  const min = Math.round((now - then) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24 && iso.slice(0, 10) === TODAY) return `il y a ${h} h`;
  if (iso.slice(0, 10) === TODAY) return "aujourd'hui";
  const diffDays = Math.round((now - then) / 86_400_000);
  if (diffDays <= 1) return "hier";
  const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Aperçu de la cloche : les plus récentes seulement, la liste complète est sur /notifications.
const PREVIEW_COUNT = 6;

export default function NotificationDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : "Notifications"}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-400 px-1 text-[12px] font-semibold leading-none text-white">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
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
          <h5 className="text-lg font-semibold text-gray-800">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-theme-sm font-medium text-gray-400">{unreadCount} non lues</span>
            )}
          </h5>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-theme-xs font-medium text-brand-700 hover:underline"
              >
                Tout marquer lu
              </button>
            )}
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
        </div>

        {preview.length === 0 ? (
          <p className="px-3 py-8 text-center text-theme-sm text-gray-500">
            Aucune notification. Vous êtes à jour.
          </p>
        ) : (
          <ul className="flex flex-col overflow-y-auto custom-scrollbar">
            {preview.map((n) => (
              <li key={n.id}>
                <DropdownItem
                  tag="a"
                  href={n.href}
                  onItemClick={() => {
                    markRead(n.id);
                    setIsOpen(false);
                  }}
                  baseClassName=""
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-50 ${
                    n.read ? "" : "bg-brand-50/40"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[n.tone]}`} />
                  <span className="block min-w-0 flex-1">
                    <span
                      className={`mb-0.5 block truncate text-theme-sm ${
                        n.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="mb-1 block text-theme-sm text-gray-500">{n.body}</span>
                    <span className="block text-theme-xs text-gray-400">
                      {CATEGORY_LABELS[n.category]} · {relative(n.date)}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Voir toutes les notifications
        </Link>
      </Dropdown>
    </div>
  );
}
