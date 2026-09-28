import { cn } from "@/lib/prise-rdv/utils";
import type { PersonTab } from "@/lib/prise-rdv/types";

type PersonToggleProps = {
  people: PersonTab[];
  activePersonId: string;
  onChange: (personId: string) => void;
  /** Draws attention to one person's button (e.g. "answer for this person too") until they click it. */
  highlightPersonId?: string | null;
};

export function PersonToggle({ people, activePersonId, onChange, highlightPersonId }: PersonToggleProps) {
  if (people.length < 2) return null;

  return (
    <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-[rgba(136,102,102,0.2)] bg-white p-1 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]">
      {people.map((person) => (
        <button
          key={person.id}
          type="button"
          onClick={() => onChange(person.id)}
          aria-pressed={activePersonId === person.id}
          className={cn(
            "rounded-full px-[17px] py-[9px] text-[15px] font-[450] whitespace-nowrap transition",
            activePersonId === person.id
              ? "bg-[var(--brand-taupe-muted)] text-white"
              : "text-[var(--color-gray-600)] hover:text-[var(--brand-taupe-muted)]",
            person.id === highlightPersonId && "animate-pulse ring-2 ring-[var(--color-error)] ring-offset-2",
          )}
        >
          {person.label}
        </button>
      ))}
    </div>
  );
}
