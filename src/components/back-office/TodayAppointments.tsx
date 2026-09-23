"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck2, MapPin, User } from "lucide-react";
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

// Restylé sur le Figma node 286:33 (« Planning des Rendez-vous du Jour ») :
// une carte unique qui enveloppe les colonnes par salon (avant : une carte
// séparée par salon). Statut « Confirmé » du mock Figma volontairement omis —
// un RDV réservé n'a pas d'étape de confirmation ici (cf. CLAUDE.md, « pas de
// bandeau d'acompte / pas d'étape de confirmation »), lui en ajouter une dans
// ce restylage aurait réintroduit un état qui n'existe pas dans le produit.
export default function TodayAppointments({ scope }: { scope: SalonScope }) {
  const { setScope } = useLocation();
  const list = salonsToday(scope);
  const total = list.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="rounded-xl border border-[#efe9e8] bg-white shadow-[0px_2px_8px_-2px_rgba(90,66,66,0.04),0px_1px_3px_0px_rgba(90,66,66,0.02)]">
      <div className="flex items-center justify-between border-b border-[#efe9e8] px-6 py-5">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="h-[18px] w-[18px] text-[#2d2626]" />
          <h3 className="text-[18px] font-semibold text-[#2d2626]">Rendez-vous du Jour</h3>
        </div>
        <span className="rounded-full border border-[#e8beba] bg-[#faf4f4] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#5a4242]">
          {total} réservation{total > 1 ? "s" : ""}
        </span>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 p-6 ${list.length > 1 ? "sm:grid-cols-2" : ""}`}
      >
        {list.map((salon) => {
          const nextIndex = salon.appointments.findIndex(
            (a) => a.status !== "annulé" && a.time >= today.currentTime,
          );

          return (
            <div
              key={salon.id}
              className="flex flex-col rounded-lg border border-[#efe9e8] bg-[#f9f8f8] p-[17px]"
            >
              <div className="flex items-center justify-between border-b border-[#efe9e8] pb-2.5">
                <div className="flex items-center gap-2 text-[16px] font-semibold text-[#2d2626]">
                  <MapPin className="h-4 w-4 text-[#886666]" />
                  Salon {salon.name}
                </div>
                <span className="rounded-full border border-[#e8beba] bg-[#fdcfcb] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#5a4242]">
                  {salon.count} RDV
                </span>
              </div>

              {salon.appointments.length === 0 ? (
                <p className="pt-4 text-theme-sm text-[#6a6060]">
                  Aucun rendez-vous aujourd&apos;hui
                </p>
              ) : (
                <ul className="flex flex-col gap-3 pt-3">
                  {salon.appointments.map((appt, i) => {
                    const isNext = i === nextIndex;
                    const isPast = appt.time < today.currentTime && appt.status !== "annulé";
                    const badge = STATUS_BADGE[appt.status];
                    return (
                      <li
                        key={`${appt.time}-${appt.client}`}
                        className={`rounded-lg border bg-white p-[13px] ${
                          isNext ? "border-2 border-brand-500" : "border-[#efe9e8]"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1">
                          <span
                            className={`text-[12px] tracking-wide ${
                              isNext
                                ? "font-bold text-[#5a4242]"
                                : `font-semibold ${isPast ? "text-gray-400" : "text-[#6a6060]"}`
                            }`}
                          >
                            {appt.time}
                          </span>
                          {isNext ? (
                            <span className="rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white">
                              PROCHAIN
                            </span>
                          ) : (
                            badge && (
                              <Badge size="sm" color={badge.color}>
                                {badge.label}
                              </Badge>
                            )
                          )}
                        </div>
                        <p
                          className={`text-[14px] font-semibold ${isPast ? "text-gray-400" : "text-[#2d2626]"}`}
                        >
                          {appt.client}
                        </p>
                        <p className="text-[13px] text-[#6a6060]">{appt.service}</p>
                        <div className="mt-2 flex items-center gap-1.5 border-t border-[#efe9e8] pt-2">
                          <User className="h-3 w-3 text-[#6a6060]" />
                          <span className="text-[11px] font-semibold tracking-wide text-[#6a6060]">
                            Coiffeuse : {appt.staff}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Link
                href="/rendez-vous"
                onClick={() => setScope(salon.id)}
                className="mt-4 flex items-center justify-center gap-1 border-t border-[#efe9e8] pt-3 text-[12px] font-semibold tracking-wide text-[#735454] hover:text-brand-700"
              >
                Voir l&apos;agenda complet
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
