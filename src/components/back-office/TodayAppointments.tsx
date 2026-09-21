"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { useLocation } from "@/context/LocationContext";
import {
  salonsToday,
  today,
  type AppointmentStatus,
  type SalonScope,
} from "@/lib/mock/beautyandco";

const STATUS_BADGE: Partial<
  Record<AppointmentStatus, { color: "warning" | "error"; label: string }>
> = {
  annulé: { color: "error", label: "Annulé" },
};

export default function TodayAppointments({ scope }: { scope: SalonScope }) {
  const { setScope } = useLocation();
  const list = salonsToday(scope);

  return (
    <div
      className={`grid grid-cols-1 items-start gap-4 md:gap-6 ${
        list.length > 1 ? "sm:grid-cols-2" : ""
      }`}
    >
      {list.map((salon) => {
        const nextIndex = salon.appointments.findIndex(
          (a) => a.status !== "annulé" && a.time >= today.currentTime,
        );

        return (
          <div
            key={salon.id}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--shadow-card)] md:p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MapPin className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{salon.name}</h3>
                  <p className="text-theme-sm text-gray-500">{salon.area}</p>
                </div>
              </div>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-brand-500 px-2 text-theme-sm font-semibold text-white">
                {salon.count}
              </span>
            </div>

            {salon.appointments.length === 0 ? (
              <p className="mt-4 text-theme-sm text-gray-500">
                Aucun rendez-vous aujourd&apos;hui
              </p>
            ) : (
              <ul className="mt-4 flex-1 divide-y divide-gray-100">
                {salon.appointments.map((appt, i) => {
                  const isNext = i === nextIndex;
                  const isPast = appt.time < today.currentTime && appt.status !== "annulé";
                  const badge = STATUS_BADGE[appt.status];
                  return (
                    <li
                      key={`${appt.time}-${appt.client}`}
                      className={`flex items-center justify-between gap-3 py-2.5 text-theme-sm ${
                        isNext ? "-mx-2 rounded-lg bg-brand-50/60 px-2" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${isPast ? "text-gray-400" : "text-gray-800"}`}
                          >
                            {appt.time}
                          </span>
                          <span className={isPast ? "text-gray-400" : "text-gray-700"}>
                            {appt.client}
                          </span>
                          {isNext && (
                            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-white">
                              Prochain
                            </span>
                          )}
                        </div>
                        <span className="text-theme-xs text-gray-400">
                          {appt.service} · {appt.staff}
                        </span>
                      </div>
                      {badge && (
                        <Badge size="sm" color={badge.color}>
                          {badge.label}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              href="/rendez-vous"
              onClick={() => setScope(salon.id)}
              className="mt-4 inline-flex text-theme-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Voir les rendez-vous du salon →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
