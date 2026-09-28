/** Flat deposit required to confirm a booking, regardless of the total price. */
export const DEPOSIT_AMOUNT = 5000;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatBookingDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Groups digits by 3 with a non-breaking space — `toLocaleString("fr-FR")`'s own thousands
 *  separator is a narrow no-break space that can render as good as invisible next to certain
 *  digits (e.g. "31000" instead of "31 000"), so this spells it out explicitly instead. */
function groupThousands(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPrice(amount: number): string {
  return `${groupThousands(amount)} F CFA`;
}

export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const endHours = Math.floor(total / 60) % 24;
  const endMinutes = total % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}
