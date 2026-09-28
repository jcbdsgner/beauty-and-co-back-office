"use client";

import { WEEKDAYS, WEEKDAY_LABELS, salons, type Weekday } from "@/lib/mock/beautyandco";
import type { DayShift, Member } from "@/lib/mock/staff";
import { Toggle } from "./ui";

type Props = {
  baseHours: Member["baseHours"];
  onChange: (next: Member["baseHours"]) => void;
};

type WorkingShift = Extract<DayShift, { off: false }>;

const DEFAULT_WORKING: WorkingShift = {
  off: false,
  salonId: salons[0].id,
  start: "09:00",
  end: "19:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

const timeField =
  "h-9 rounded-field border border-base-300 bg-white px-2.5 text-sm text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]";

function WorkingControls({
  weekday,
  shift,
  onChange,
}: {
  weekday: Weekday;
  shift: WorkingShift;
  onChange: (next: WorkingShift) => void;
}) {
  const hasBreak = shift.breakStart != null && shift.breakEnd != null;
  const patch = (part: Partial<WorkingShift>) => onChange({ ...shift, ...part });
  const day = WEEKDAY_LABELS[weekday];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-base-content/60">
      <select
        value={shift.salonId}
        onChange={(e) => patch({ salonId: e.target.value as WorkingShift["salonId"] })}
        className={timeField}
        aria-label={`Salon — ${day}`}
      >
        {salons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <span className="flex items-center gap-1.5">
        <input
          type="time"
          value={shift.start}
          onChange={(e) => patch({ start: e.target.value })}
          className={timeField}
          aria-label={`Heure de début — ${day}`}
        />
        <span>–</span>
        <input
          type="time"
          value={shift.end}
          onChange={(e) => patch({ end: e.target.value })}
          className={timeField}
          aria-label={`Heure de fin — ${day}`}
        />
      </span>

      {hasBreak ? (
        <span className="flex items-center gap-1.5">
          <span className="text-base-content/45">coupure</span>
          <input
            type="time"
            value={shift.breakStart}
            onChange={(e) => patch({ breakStart: e.target.value })}
            className={timeField}
            aria-label={`Début de coupure — ${day}`}
          />
          <span>–</span>
          <input
            type="time"
            value={shift.breakEnd}
            onChange={(e) => patch({ breakEnd: e.target.value })}
            className={timeField}
            aria-label={`Fin de coupure — ${day}`}
          />
          <button
            type="button"
            onClick={() => patch({ breakStart: undefined, breakEnd: undefined })}
            className="text-xs font-medium text-base-content/45 hover:text-error-600"
          >
            retirer
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => patch({ breakStart: "13:00", breakEnd: "14:00" })}
          className="text-xs font-medium text-brand-600 hover:text-secondary"
        >
          + ajouter une coupure
        </button>
      )}
    </div>
  );
}

function DayRow({
  weekday,
  shift,
  onChange,
}: {
  weekday: Weekday;
  shift: DayShift;
  onChange: (next: DayShift) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5">
      <div className="flex w-40 items-center gap-3">
        <Toggle
          checked={!shift.off}
          onChange={(on) => onChange(on ? DEFAULT_WORKING : { off: true })}
          aria-label={`${WEEKDAY_LABELS[weekday]} travaillé`}
        />
        <span className="text-sm font-medium text-base-content">{WEEKDAY_LABELS[weekday]}</span>
      </div>

      {shift.off ? (
        <span className="text-sm text-base-content/45">Repos</span>
      ) : (
        <WorkingControls weekday={weekday} shift={shift} onChange={onChange} />
      )}
    </div>
  );
}

export default function MemberSchedulePanel({ baseHours, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/60">
        Ces horaires sont la trame de référence, salon compris : le Planning les
        applique chaque semaine, et vous n&apos;y saisissez que les exceptions
        (absences, ajustements). Une personne peut très bien travailler dans un
        salon un jour et dans l&apos;autre le lendemain.
      </p>
      <div className="rounded-box border border-base-300 bg-white">
        <div className="divide-y divide-base-300">
          {WEEKDAYS.map((weekday) => (
            <DayRow
              key={weekday}
              weekday={weekday}
              shift={baseHours[weekday]}
              onChange={(next) => onChange({ ...baseHours, [weekday]: next })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
