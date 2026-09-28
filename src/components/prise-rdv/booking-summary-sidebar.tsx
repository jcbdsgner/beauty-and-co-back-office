import Image from "next/image";
import { groupCartItemsByPack } from "@/lib/prise-rdv/cart";
import type { CartItem } from "@/lib/prise-rdv/types";
import { formatBookingDate, formatDurationMinutes, formatPrice } from "@/lib/prise-rdv/format";
import { cn } from "@/lib/prise-rdv/utils";

type BookingSummarySidebarProps = {
  step: 1 | 2 | 3 | 4;
  cartItems: CartItem[];
  showPersonLabels?: boolean;
  date?: Date | null;
  time?: string | null;
  locationLabel?: string | null;
  totalMinutesOverride?: number;
};

export function BookingSummarySidebar({
  step,
  cartItems,
  showPersonLabels = false,
  date,
  time,
  locationLabel,
  totalMinutesOverride,
}: BookingSummarySidebarProps) {
  const totalMinutes =
    totalMinutesOverride ?? cartItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const { grouped, ungrouped } = groupCartItemsByPack(cartItems);

  return (
    <aside className="h-fit rounded-2xl border border-[rgba(136,102,102,0.2)] bg-white p-6 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)] lg:sticky lg:top-10 lg:self-start">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[21px] leading-snug font-bold text-[var(--brand-taupe-muted)]">
          Résumé de votre
          <br />
          réservation
        </h3>
        <span className="shrink-0 text-[15px] font-[450] whitespace-nowrap text-[var(--color-gray-500)]">
          {step}/4 étapes
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {date && time && (
          <div className="flex items-start gap-3 rounded-xl bg-[rgba(237,220,218,0.3)] px-4 py-3">
            <Image src="/images/rdv/icon-calendar.svg" alt="" width={20} height={20} className="mt-0.5" />
            <div>
              <p className="text-[17px] font-bold text-[var(--color-gray-800)]">{formatBookingDate(date)}</p>
              <p className="text-[17px] text-[var(--color-gray-600)]">{time}</p>
            </div>
          </div>
        )}

        {locationLabel && (
          <div className="flex items-center gap-3 rounded-xl bg-[rgba(237,220,218,0.3)] px-4 py-3">
            <Image src="/images/rdv/icon-location.svg" alt="" width={20} height={20} />
            <p className="text-[17px] font-bold text-[var(--color-gray-800)] uppercase">{locationLabel}</p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="flex items-center gap-3 px-1 py-2">
            <Image src="/images/rdv/icon-plus.svg" alt="" width={20} height={20} />
            <span className="text-[17px] font-[450] text-[var(--brand-taupe-muted)]">Ajoutez des services</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-[rgba(237,220,218,0.3)] px-4 py-3">
            <div className="flex items-center gap-3">
              <Image src="/images/rdv/icon-scissors-outline.svg" alt="" width={20} height={20} />
              <p className="text-[17px]">
                <span className="font-bold text-[var(--color-gray-800)]">
                  {cartItems.length} prestation{cartItems.length > 1 ? "s" : ""}
                </span>{" "}
                <span className="text-[var(--color-gray-500)]">· {formatDurationMinutes(totalMinutes)}</span>
              </p>
            </div>

            <ul className="flex flex-col gap-1">
              {ungrouped.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-[15px]">
                  <span className="text-[var(--color-gray-600)]">
                    {item.label}
                    {showPersonLabels && (
                      <span className="text-[var(--color-gray-400)]"> · {item.personLabel}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-[450]",
                      item.coverageSource ? "text-[var(--brand-taupe-muted)]" : "text-[var(--color-gray-800)]",
                    )}
                  >
                    {item.coverageSource ? "Déjà payé" : formatPrice(item.price)}
                  </span>
                </li>
              ))}

              {grouped.map((group) => (
                <li key={group.key} className="flex flex-col gap-1.5 rounded-lg bg-white/60 px-2 py-2">
                  <div className="flex items-center justify-between gap-2 text-[15px]">
                    <span className="font-bold text-[var(--color-gray-800)]">
                      {group.pack.label}
                      {showPersonLabels && (
                        <span className="font-[450] text-[var(--color-gray-400)]"> · {group.personLabel}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-[450] text-[var(--brand-taupe-muted)]">
                      {formatPrice(group.pack.price)}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-[13px] text-[var(--color-gray-400)]"
                      >
                        <span>{item.label}</span>
                        <span className="shrink-0 line-through">{formatPrice(item.originalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-[rgba(128,101,98,0.15)] pt-3">
              <span className="text-[17px] font-bold text-[var(--color-gray-800)]">Total</span>
              <span className="text-[19px] font-bold text-[var(--brand-taupe-muted)]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-[var(--color-gray-200)] pt-5">
        <p className="text-[15px] text-[var(--color-gray-500)]">
          En effectuant cette réservation, vous acceptez nos{" "}
          <a href="#" className="underline">
            conditions générales de vente
          </a>
          .
        </p>
      </div>
    </aside>
  );
}
