"use client";

import { useState, type ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  /** Days strictly before this one are shown greyed out and unclickable (ex. réservation : pas de jour passé). */
  minDate?: Date;
  /** Remplace le champ par défaut (ex. le libellé de période du Planning). Rendu en `asChild` :
   *  doit être un unique élément bouton. */
  trigger?: ReactNode;
  align?: "start" | "center" | "end";
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Monday-first offset (French week convention) — JS getDay() is Sunday-first (0-6).
function leadingBlanks(d: Date) {
  return (startOfMonth(d).getDay() + 6) % 7;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Popover-anchored month calendar — for a rendez-vous date, a client birthday, a report range
 *  boundary. Kept dependency-free (plain Date math, fr-FR labels, Monday-first, 48px cells) rather
 *  than pulled onto react-day-picker: it already does everything a themed calendar lib would, at a
 *  fraction of the CSS surface, and stays fully inside the flat brand language. */
export function DatePicker({ value, onChange, placeholder = "Choisir une date", className, minDate, trigger, align = "start" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value ?? new Date()));

  const label = value
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(value)
    : placeholder;

  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(visibleMonth);
  const totalDays = daysInMonth(visibleMonth);
  const blanks = leadingBlanks(visibleMonth);
  const today = new Date();

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        // Rouvre toujours sur le mois de la date courante (elle a pu changer par ailleurs).
        if (next && value) setVisibleMonth(startOfMonth(value));
        setOpen(next);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        {trigger ?? (
        <button
          type="button"
          className={cn(
            // Même champ daisyUI que SearchInput / TextInput : rayon et hauteur du reste de la plateforme.
            "input w-full items-center gap-2 bg-base-100 text-left text-[15px] tabular-nums",
            value ? "text-base-content" : "text-base-content/45",
            className,
          )}
        >
          <CalendarIcon aria-hidden className="size-4 shrink-0 text-base-content/45" />
          {label}
        </button>
        )}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          // Widened from w-72: the day grid below needed 44px cells (touch minimum), which a
          // 288px-wide popover couldn't fit 7 of without shrinking them back under the minimum.
          className="z-50 w-[23rem] rounded-box border border-base-300 bg-white p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.1)] focus:outline-none"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mois précédent"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className="flex size-12 items-center justify-center rounded-full text-base-content/55 transition active:scale-90 active:bg-muted hover:bg-muted"
            >
              <ChevronLeft aria-hidden className="size-4" />
            </button>
            <p className="text-sm font-semibold text-base-content capitalize">{monthLabel}</p>
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className="flex size-12 items-center justify-center rounded-full text-base-content/55 transition active:scale-90 active:bg-muted hover:bg-muted"
            >
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-base-content/45">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: blanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const selected = value && isSameDay(date, value);
              const isToday = isSameDay(date, today);
              const disabled = minDate ? date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(date);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-sm transition active:scale-90",
                    disabled
                      ? "cursor-not-allowed text-base-content/25"
                      : selected
                        ? "bg-primary font-semibold text-primary-foreground"
                        : isToday
                          ? "font-semibold text-secondary"
                          : "text-base-content/80 active:bg-accent hover:bg-accent",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
