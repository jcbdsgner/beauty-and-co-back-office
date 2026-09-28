import Image from "next/image";
import { cn } from "@/lib/prise-rdv/utils";
import { BookingCalendar } from "@/components/prise-rdv/booking-calendar";
import { TwoPractitionersToggle } from "@/components/prise-rdv/two-practitioners-toggle";
import { StepFooter } from "@/components/prise-rdv/steps/step-footer";
import type { BookingLocation } from "@/lib/prise-rdv/data/booking-locations";
import { addMinutes, formatDurationMinutes } from "@/lib/prise-rdv/format";

/** Une prestation posée sur l'horaire choisi, avec sa (ses) praticienne(s) — proposée(s) d'office, modifiable(s) (ADR 0032). */
export type StaffRow = {
  key: string;
  label: string;
  personLabel?: string;
  start: string;
  end: string;
  staffIds: string[];
  /** Praticiennes libres sur cet intervalle, la (les) choisie(s) comprise(s). */
  options: { id: string; name: string }[];
};

type CreneauStepProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  locations: BookingLocation[];
  /** Lieux fermés le jour choisi (Almadies le lundi) — affichés, non choisissables. */
  closedLocationIds: string[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  /** Horaires où tout le panier tient, calculés depuis l'agenda de l'équipe (remplace la liste fixe du site). */
  timeSlots: string[];
  staffRows: StaffRow[];
  onChangeStaff: (key: string, index: number, staffId: string) => void;
  totalMinutes: number;
  twoPractitionersMinutes: number;
  twoPractitioners: boolean;
  onToggleTwoPractitioners: (enabled: boolean) => void;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
};

export function CreneauStep({
  selectedDate,
  onSelectDate,
  locations,
  closedLocationIds,
  selectedLocationId,
  onSelectLocation,
  selectedTime,
  onSelectTime,
  timeSlots,
  staffRows,
  onChangeStaff,
  totalMinutes,
  twoPractitionersMinutes,
  twoPractitioners,
  onToggleTwoPractitioners,
  canContinue,
  onContinue,
  onBack,
}: CreneauStepProps) {
  const effectiveMinutes = twoPractitioners ? twoPractitionersMinutes : totalMinutes;
  const weekday = selectedDate ? new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(selectedDate) : "";
  const selectedLocation = locations.find((location) => location.id === selectedLocationId);
  const selectedClosed = Boolean(selectedLocationId && closedLocationIds.includes(selectedLocationId));
  return (
    <div>
      <h2 className="text-[21px] font-bold text-[var(--color-gray-800)]">Choisir un créneau</h2>
      <p className="mt-1 text-[19px] text-[var(--color-gray-500)]">
        Choisissez un jour, une heure, et un lieu qui vous conviennent.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="sm:max-w-[384px] sm:flex-1">
          <BookingCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
        </div>

        {selectedDate && (
          <div className="flex flex-col gap-4 sm:flex-1">
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-[25px]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[rgba(237,220,218,0.4)]">
                  <Image src="/images/rdv/icon-location.svg" alt="" width={20} height={20} />
                </span>
                <h3 className="text-[19px] font-bold text-[var(--color-gray-800)]">Choisissez un lieu</h3>
              </div>
              <div className="mt-4 flex gap-2">
                {locations.map((location) => {
                  const closed = closedLocationIds.includes(location.id);
                  return (
                    <button
                      key={location.id}
                      type="button"
                      disabled={closed}
                      onClick={() => onSelectLocation(location.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg px-4 py-2 text-[17px] font-bold transition",
                        closed
                          ? "cursor-not-allowed border border-dashed border-[var(--color-gray-200)] bg-[var(--color-gray-50)] text-[var(--color-gray-400)]"
                          : selectedLocationId === location.id
                            ? "bg-[var(--core-brand-color)] text-[var(--brand-taupe-muted)] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]"
                            : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)]",
                      )}
                    >
                      {location.label}
                      {closed && <span className="text-[14px] font-medium">Fermé le {weekday}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLocationId && (
              <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-[25px]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[rgba(237,220,218,0.4)]">
                    <Image src="/images/rdv/icon-clock-heading.svg" alt="" width={20} height={20} />
                  </span>
                  <h3 className="text-[19px] font-bold text-[var(--color-gray-800)]">Choisissez un créneau</h3>
                </div>

                {timeSlots.length === 0 && (
                  <p className="mt-4 text-[17px] text-[var(--color-gray-500)]">
                    {selectedClosed
                      ? `${selectedLocation?.label ?? "Ce salon"} est fermé le ${weekday}. Choisissez un autre jour ou un autre lieu.`
                      : "Aucun créneau disponible ce jour-là dans ce salon. Choisissez un autre jour ou un autre lieu."}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectTime(slot)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-[17px] font-bold transition",
                        selectedTime === slot
                          ? "bg-[var(--core-brand-color)] text-[var(--brand-taupe-muted)] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]"
                          : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)]",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {selectedTime && totalMinutes > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-[rgba(237,220,218,0.4)] px-4 py-3">
                    <Image src="/images/rdv/icon-info-banner.svg" alt="" width={16} height={16} />
                    <p className="text-[17px] text-[var(--brand-taupe-muted)]">
                      Votre rendez-vous se terminera vers{" "}
                      <span className="font-bold">{addMinutes(selectedTime, effectiveMinutes)}</span>{" "}
                      ({formatDurationMinutes(effectiveMinutes)} au total)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTime && (
        <TwoPractitionersToggle
          enabled={twoPractitioners}
          onChange={onToggleTwoPractitioners}
          soloMinutes={totalMinutes}
          twoPractitionersMinutes={twoPractitionersMinutes}
        />
      )}

      {selectedTime && staffRows.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--color-gray-200)] bg-white p-[25px]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[rgba(237,220,218,0.4)]">
              <Image src="/images/rdv/icon-user.svg" alt="" width={20} height={20} />
            </span>
            <div>
              <h3 className="text-[19px] font-bold text-[var(--color-gray-800)]">Praticiennes</h3>
              <p className="text-[15px] text-[var(--color-gray-500)]">
                Proposées selon leurs disponibilités — modifiables parmi celles qui sont libres.
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {staffRows.map((row) => (
              <li key={row.key} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#fafafa] px-4 py-3">
                <div className="min-w-[220px] flex-1">
                  <p className="text-[17px] font-bold text-[var(--color-gray-900)]">{row.label}</p>
                  <p className="text-[15px] text-[var(--text-secondary)]">
                    {row.personLabel ? `${row.personLabel} · ` : ""}
                    {row.start} – {row.end}
                  </p>
                </div>
                {row.staffIds.map((staffId, index) => (
                  <select
                    key={index}
                    aria-label={`Praticienne ${index + 1} — ${row.label}`}
                    value={staffId}
                    onChange={(event) => onChangeStaff(row.key, index, event.target.value)}
                    className="h-11 min-w-[180px] rounded-lg border border-[var(--color-gray-200)] bg-white px-3 text-[17px] font-bold text-[var(--color-gray-600)] outline-none focus:border-[var(--brand-taupe-muted)]"
                  >
                    {row.options
                      .filter((option) => option.id === staffId || !row.staffIds.includes(option.id))
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <StepFooter onBack={onBack} onContinue={onContinue} continueDisabled={!canContinue} />
      </div>
    </div>
  );
}
