import type { Attendees } from "@/components/prise-rdv/attendees-dialog";
import type { PersonTab } from "@/lib/prise-rdv/types";

export function buildPersonTabs(attendees: Attendees | null): PersonTab[] {
  if (!attendees) return [];

  const tabs: PersonTab[] = [];

  for (let i = 1; i <= attendees.adults; i++) {
    tabs.push({
      id: `adulte-${i}`,
      label: attendees.adults > 1 ? `Adulte ${i}` : "Adulte",
      type: "adult",
    });
  }

  for (let i = 1; i <= attendees.children; i++) {
    tabs.push({
      id: `enfant-${i}`,
      label: attendees.children > 1 ? `Enfant ${i}` : "Enfant",
      type: "child",
    });
  }

  return tabs;
}
