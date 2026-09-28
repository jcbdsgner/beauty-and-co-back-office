import { Fragment, useState } from "react";
import Image from "next/image";
import { BarBeautySection } from "@/components/prise-rdv/steps/bar-beauty-section";
import { BoutiquePreviewSection } from "@/components/prise-rdv/steps/boutique-preview-section";
import { Button } from "@/components/prise-rdv/ui/button";
import { bookingServices } from "@/lib/prise-rdv/data/booking-services";
import { barBeautyDrinks } from "@/lib/prise-rdv/data/bar-beauty";
import { boutiqueHighlights } from "@/lib/prise-rdv/data/boutique-highlights";
import { type CartDisplayGroup, groupCartItemsByPack } from "@/lib/prise-rdv/cart";
import { emptyContactInfo, type CartItem, type ContactInfo, type PersonTab } from "@/lib/prise-rdv/types";
import { addMinutes, formatDurationMinutes, formatPrice } from "@/lib/prise-rdv/format";
import { cn } from "@/lib/prise-rdv/utils";

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/** Boissons et produits choisis sur la confirmation — pré-commandés avec la réservation. */
export type ConfirmationExtras = { drinkIds: string[]; products: { id: string; qty: number }[] };

type ConfirmationStepProps = {
  cartItems: CartItem[];
  note: string;
  onNoteChange: (note: string) => void;
  locationLabel: string | null;
  date: Date | null;
  time: string | null;
  totalMinutes: number;
  adults: PersonTab[];
  contactInfoByPerson: Record<string, ContactInfo>;
  onBack: () => void;
  /** « Terminé » — l'acompte se règle ensuite (ADR 0032). Pas d'« Encaisser maintenant » ici :
   *  le back-office n'a pas de caisse, l'encaissement se fait au point de vente. */
  onConfirm: (grandTotal: number, extras: ConfirmationExtras) => void;
  initialDrinkIds?: string[];
  initialProductQuantities?: Record<string, number>;
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 basis-full items-center gap-4 rounded-2xl border-[1.5px] border-[var(--color-gray-100)] p-4 sm:basis-auto sm:min-w-[260px] sm:flex-1">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-cream)]">
        <Image src={icon} alt="" width={24} height={24} />
      </span>
      <div className="min-w-0">
        <p className="text-[19px] font-bold text-[var(--color-gray-900)]">{label}</p>
        <p className="truncate text-[19px] text-[var(--text-secondary)]">{value}</p>
      </div>
    </div>
  );
}

function PrestationOption({ item }: { item: CartItem }) {
  return (
    <div className="rounded-2xl bg-[#fafafa] px-4 py-3">
      <p className="text-[17px] font-bold text-[var(--color-gray-900)]">{item.label}</p>
      <div className="mt-2 flex items-center gap-3 text-[16px] text-[var(--text-secondary)]">
        <span
          className={cn(
            "flex items-center gap-1",
            item.coverageSource && "font-bold text-[var(--brand-taupe-muted)]",
          )}
        >
          <Image src="/images/rdv/icon-price-tag.svg" alt="" width={16} height={16} />
          {item.coverageSource === "pack"
            ? "Déjà payé avec votre pack"
            : item.coverageSource === "abonnement"
              ? "Déjà payé avec votre abonnement"
              : formatPrice(item.price)}
        </span>
        <span className="flex items-center gap-1">
          <Image src="/images/rdv/icon-clock.svg" alt="" width={16} height={16} />
          {item.duration}
        </span>
      </div>
    </div>
  );
}

/** A Pack whose every prestation is selected for this person — shown as one block with the Pack's
 *  own name and discounted price, and each included prestation's à la carte price struck through,
 *  instead of listing them individually among the other services (see groupCartItemsByPack). */
function PackGroupCard({ group }: { group: CartDisplayGroup }) {
  return (
    <div className="rounded-2xl border border-[var(--brand-taupe-muted)]/30 bg-[rgba(216,184,180,0.08)] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[17px] font-bold text-[var(--color-gray-900)]">{group.pack.label}</p>
        <p className="shrink-0 text-[17px] font-bold text-[var(--brand-taupe-muted)]">{formatPrice(group.pack.price)}</p>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {group.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-[15px] text-[var(--color-gray-600)]">
            <span>{item.label}</span>
            <span className="shrink-0 text-[var(--color-gray-400)] line-through">{formatPrice(item.originalPrice)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryGroup({ categoryId, categoryLabel, items }: { categoryId: string; categoryLabel: string; items: CartItem[] }) {
  const category = bookingServices.find((service) => service.id === categoryId);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-gray-100)] p-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[rgba(237,220,218,0.4)]">
          {category && (
            <Image
              src={category.image}
              alt=""
              width={category.iconOnly ? 24 : 44}
              height={category.iconOnly ? 24 : 44}
              className={category.iconOnly ? undefined : "size-full object-cover"}
            />
          )}
        </span>
        <p className="min-w-0 text-[19px] font-bold text-[var(--color-gray-900)]">{categoryLabel}</p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <PrestationOption key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function ConfirmationStep({
  cartItems,
  note,
  onNoteChange,
  locationLabel,
  date,
  time,
  totalMinutes,
  adults,
  contactInfoByPerson,
  onBack,
  onConfirm,
  initialDrinkIds,
  initialProductQuantities,
}: ConfirmationStepProps) {
  const personLabels = Array.from(new Set(cartItems.map((item) => item.personId))).map(
    (personId) => cartItems.find((item) => item.personId === personId)!.personLabel,
  );
  const showPersonGroups = personLabels.length > 1;
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const [hasFocusedNote, setHasFocusedNote] = useState(false);
  const [reservedDrinkIds, setReservedDrinkIds] = useState<Set<string>>(() => new Set(initialDrinkIds ?? []));
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>(() => initialProductQuantities ?? {});
  const [selectedSizeByProductId, setSelectedSizeByProductId] = useState<Record<string, string>>({});
  const drinksTotal = barBeautyDrinks
    .filter((drink) => reservedDrinkIds.has(drink.id))
    .reduce((sum, drink) => sum + drink.price, 0);
  const productsTotal = boutiqueHighlights.reduce((sum, product) => {
    const quantity = productQuantities[product.id] ?? 0;
    const selectedSize = selectedSizeByProductId[product.id] ?? product.sizes[0].label;
    const activeSize = product.sizes.find((size) => size.label === selectedSize) ?? product.sizes[0];
    return sum + quantity * activeSize.price;
  }, 0);
  const grandTotal = totalPrice + drinksTotal + productsTotal;

  const handleProductQuantityChange = (id: string, quantity: number) => {
    setProductQuantities((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }
      return next;
    });
  };
  const handleProductSizeChange = (id: string, size: string) => {
    setSelectedSizeByProductId((prev) => ({ ...prev, [id]: size }));
  };
  const extras: ConfirmationExtras = {
    drinkIds: Array.from(reservedDrinkIds),
    products: Object.entries(productQuantities).map(([id, qty]) => ({ id, qty })),
  };
  const hasCoiffure = cartItems.some((item) => item.categoryId === "coiffure");

  return (
    <div>
      <h2 className="text-[21px] font-bold text-[var(--color-gray-800)]">Confirmer votre rendez-vous</h2>
      <p className="mt-1 text-[19px] text-[var(--color-gray-500)]">Confirmez tous les détails de votre rendez-vous.</p>

      <div className="mt-6 h-px bg-[var(--color-gray-200)]" />

      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--color-gray-100)] bg-white p-6">
            <h3 className="text-[21px] font-bold text-[var(--color-gray-900)]">Détails de votre rendez-vous</h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <DetailRow
                icon="/images/rdv/icon-calendar.svg"
                label="Date"
                value={date ? date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              />
              <DetailRow
                icon="/images/rdv/icon-clock.svg"
                label="Heure"
                value={time ? `${time}${totalMinutes > 0 ? ` — ${addMinutes(time, totalMinutes)}` : ""}` : "—"}
              />
              <DetailRow icon="/images/rdv/icon-location.svg" label="Lieu" value={locationLabel ?? "—"} />
              {adults.map((adult, index) => {
                const info = contactInfoByPerson[adult.id] ?? emptyContactInfo;
                const suffix = adults.length > 1 ? ` — ${adult.label}${index === 0 ? " (contact principal)" : ""}` : "";
                return (
                  <Fragment key={adult.id}>
                    <DetailRow
                      icon="/images/rdv/icon-user.svg"
                      label={`Prénom et nom${suffix}`}
                      value={`${info.firstName} ${info.lastName}`.trim() || "—"}
                    />
                    <DetailRow
                      icon="/images/rdv/icon-envelope.svg"
                      label={`Email${suffix}`}
                      value={info.email || "—"}
                    />
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-[var(--color-gray-100)] bg-white p-6",
              !hasFocusedNote && "attention-shake",
            )}
          >
            <p className="text-[19px] font-bold text-[var(--color-gray-900)]">
              Note pour le salon <span className="text-[17px] text-[var(--color-gray-500)]">(optionnel)</span>
            </p>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              onFocus={() => setHasFocusedNote(true)}
              placeholder="Une précision, une demande particulière…"
              rows={3}
              className="mt-3 w-full rounded-xl border border-[var(--color-border-light)] p-4 text-[17px] text-[var(--color-gray-800)] outline-none focus:border-[var(--brand-taupe-muted)]"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-gray-100)] bg-white p-6">
          <h3 className="text-[21px] font-bold text-[var(--color-gray-900)]">Les services que vous recevrez</h3>

          <div className="mt-4 flex flex-col gap-3">
            {(showPersonGroups ? personLabels : [null]).map((personLabel) => {
              const personItems = personLabel
                ? cartItems.filter((item) => item.personLabel === personLabel)
                : cartItems;
              const { grouped, ungrouped } = groupCartItemsByPack(personItems);
              const categories = Array.from(
                new Map(ungrouped.map((item) => [item.categoryId, item.categoryLabel])),
              );

              return (
                <div key={personLabel ?? "all"} className="flex flex-col gap-3">
                  {personLabel && <p className="text-[17px] font-bold text-[var(--brand-taupe-muted)]">{personLabel}</p>}
                  {categories.map(([categoryId, categoryLabel]) => (
                    <CategoryGroup
                      key={categoryId}
                      categoryId={categoryId}
                      categoryLabel={categoryLabel}
                      items={ungrouped.filter((item) => item.categoryId === categoryId)}
                    />
                  ))}
                  {grouped.map((group) => (
                    <PackGroupCard key={group.key} group={group} />
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[rgba(216,184,180,0.5)] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[17px] text-[var(--on-core-brand-color)]">
                <Image src="/images/rdv/icon-clock.svg" alt="" width={20} height={20} />
                Durée totale des soins
              </span>
              <span className="text-[19px] font-bold text-[var(--on-core-brand-color)]">{formatDurationMinutes(totalMinutes)}</span>
            </div>
            <div className="h-px bg-[rgba(45,45,45,0.1)]" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[17px] text-[var(--on-core-brand-color)]">
                <Image src="/images/rdv/icon-price-tag.svg" alt="" width={20} height={20} />
                Prix total des soins
              </span>
              <span className="text-[19px] font-bold text-[var(--on-core-brand-color)]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <BarBeautySection
          reservedDrinkIds={reservedDrinkIds}
          onToggleDrink={(id) => setReservedDrinkIds((prev) => toggleInSet(prev, id))}
        />
        {hasCoiffure && (
          <BoutiquePreviewSection
            productQuantities={productQuantities}
            onQuantityChange={handleProductQuantityChange}
            selectedSizeByProductId={selectedSizeByProductId}
            onSizeChange={handleProductSizeChange}
          />
        )}

        <div className="flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-[var(--brand-taupe-muted)] to-[rgba(128,101,98,0.9)] p-3">
          <span className="text-[19px] font-bold whitespace-nowrap text-white">Total</span>
          <span className="text-[21px] font-bold whitespace-nowrap text-white">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      <div className="mt-6 h-px bg-[var(--color-gray-200)]" />

      <p className="mt-6 text-[18px] text-[var(--text-secondary)]">
        Conditions générales de Beauty and Co communiquées à la cliente.
      </p>

      <div className="mt-8 flex flex-col items-center gap-1 pb-4 text-center">
        <p className="text-[21px] font-bold text-[var(--color-gray-900)]">Hâte de vous recevoir !</p>
        <p className="text-[17px] text-[var(--text-secondary)]">Veuillez arriver 10 min avant l&apos;heure de votre rendez-vous.</p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="w-full border-[rgba(136,102,102,0.3)] px-6 py-3 text-[var(--brand-taupe-muted)] hover:bg-black/[.02] sm:w-auto sm:py-2"
        >
          Retourner
        </Button>
        <Button type="button" onClick={() => onConfirm(grandTotal, extras)} className="w-full px-8 py-3 sm:w-auto sm:min-w-[240px] sm:py-2">
          Terminé
        </Button>
      </div>
    </div>
  );
}
