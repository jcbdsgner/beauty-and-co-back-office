"use client";

import Image from "next/image";
import { Dialog } from "@/components/prise-rdv/ui/dialog";
import { bookingServices } from "@/lib/prise-rdv/data/booking-services";
import type { PersonTab } from "@/lib/prise-rdv/types";
import { cn } from "@/lib/prise-rdv/utils";

export type RedeemablePrestation = {
  id: string;
  label: string;
  categoryId: string;
  duration: string;
};

/** One owned Pack purchase or active Abonnement with prestations still available to redeem today. */
export type RedeemableEntry = {
  /** Unique id of the owning Pack purchase or Abonnement — never collide since both are crypto.randomUUID(). */
  entryId: string;
  source: "pack" | "abonnement";
  /** Display name of the Pack or Forfait this entry comes from. */
  sourceLabel: string;
  remainingPrestations: RedeemablePrestation[];
};

export function redeemableItemKey(entryId: string, prestationId: string): string {
  return `${entryId}:${prestationId}`;
}

type AlreadyPaidDialogProps = {
  open: boolean;
  entries: RedeemableEntry[];
  /** Attendees a redemption can be assigned to — every Pack and Forfait so far only bundles adult-only categories. */
  adults: PersonTab[];
  /** redeemableItemKey -> whether that prestation is picked for this booking. Missing means not selected — nothing is pre-checked, picking one is an explicit opt-in. */
  selectedItems: Record<string, boolean>;
  /** redeemableItemKey -> personId a selected prestation is assigned to. */
  itemAssignments: Record<string, string>;
  onToggleItem: (entryId: string, prestationId: string) => void;
  onAssignItem: (entryId: string, prestationId: string, personId: string) => void;
  onViewOtherServices: () => void;
  onSkipToCreneau: () => void;
};

/** One redeemable prestation, styled after the cross-sell suggestion cards on the services step (same
 * white tile, icon, and person-targeted select pills) so a Pack or Abonnement's contents read as
 * ordinary optional prestations rather than a separate all-or-nothing bundle. */
function RedeemableItemCard({
  prestation,
  selected,
  adults,
  assignedPersonId,
  onToggle,
  onAssign,
}: {
  prestation: RedeemablePrestation;
  selected: boolean;
  adults: PersonTab[];
  assignedPersonId: string;
  onToggle: () => void;
  onAssign: (personId: string) => void;
}) {
  const category = bookingServices.find((service) => service.id === prestation.categoryId);

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[rgba(136,102,102,0.2)] bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {category && (
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(237,220,218,0.6)]">
            <Image
              src={category.image}
              alt=""
              width={category.iconOnly ? 18 : 32}
              height={category.iconOnly ? 18 : 32}
              className={category.iconOnly ? undefined : "size-full object-cover"}
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#1d2939]">{prestation.label}</p>
          <p className="text-[13px] text-[#1d2939]">{prestation.duration} · Déjà payé</p>
        </div>
      </div>

      {adults.length > 1 ? (
        <div className="shrink-0">
          <p className="text-[13px] text-[var(--color-gray-500)]">Sélectionner pour :</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {adults.map((adult) => {
              const isThisSelection = selected && assignedPersonId === adult.id;
              return (
                <button
                  key={adult.id}
                  type="button"
                  onClick={() => (isThisSelection ? onToggle() : onAssign(adult.id))}
                  aria-pressed={isThisSelection}
                  className={cn(
                    "shrink-0 rounded-full border border-[var(--brand-taupe-muted)] px-3 py-1.5 text-[14px] font-[450] whitespace-nowrap transition",
                    isThisSelection
                      ? "bg-[var(--brand-taupe-muted)] text-white"
                      : "bg-white text-[var(--brand-taupe-muted)] hover:bg-[var(--brand-taupe-muted)]/5",
                  )}
                >
                  {adult.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={cn(
            "shrink-0 self-start rounded-full border border-[var(--brand-taupe-muted)] px-3 py-1.5 text-[14px] font-[450] whitespace-nowrap transition sm:self-auto",
            selected
              ? "bg-[var(--brand-taupe-muted)] text-white"
              : "bg-white text-[var(--brand-taupe-muted)] hover:bg-[var(--brand-taupe-muted)]/5",
          )}
        >
          {selected ? "Sélectionné" : "Sélectionner"}
        </button>
      )}
    </div>
  );
}

/** Shown right after the attendee count is confirmed, when one or more owned Packs or active
 * Abonnements still have prestations available to redeem — merged into a single gate instead of
 * one dialog per source, since picking a prestation and assigning it a person is the exact same
 * interaction either way. Each prestation is its own optional pick, exactly like any other service
 * on the main prestation list: nothing forces taking everything today, and with several attendees
 * each prestation can go to a different one independently. Whatever stays deselected simply remains
 * available for a later visit (Packs never expire; Abonnements reset what's available every cycle). */
export function AlreadyPaidDialog({
  open,
  entries,
  adults,
  selectedItems,
  itemAssignments,
  onToggleItem,
  onAssignItem,
  onViewOtherServices,
  onSkipToCreneau,
}: AlreadyPaidDialogProps) {
  return (
    <Dialog
      open={open}
      labelledBy="already-paid-title"
      className="flex max-h-[90vh] max-w-[560px] flex-col overflow-hidden rounded-lg border border-[var(--color-slate-200)] shadow-[0px_10px_7.5px_0px_rgba(0,0,0,0.1),0px_4px_3px_0px_rgba(0,0,0,0.1)]"
    >
      <div className="overflow-y-auto p-6 pb-0 sm:p-8 sm:pb-0">
        <h2
          id="already-paid-title"
          className="text-center text-[23px] font-bold tracking-[-0.01em] text-[var(--brand-taupe-muted)] sm:text-[26px]"
        >
          Prestations déjà payées
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-center text-[16px] text-[var(--color-gray-500)]">
          Ajoutez celles que vous voulez pour aujourd&apos;hui. Le reste reste disponible pour une prochaine visite.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          {entries.map((entry) => (
            <div key={entry.entryId}>
              {entries.length > 1 && (
                <p className="mb-2 text-[15px] font-bold text-[var(--color-gray-700)]">{entry.sourceLabel}</p>
              )}
              <div className="flex flex-col gap-2">
                {entry.remainingPrestations.map((prestation) => {
                  const key = redeemableItemKey(entry.entryId, prestation.id);
                  const selected = selectedItems[key] ?? false;
                  const assignedPersonId = itemAssignments[key] ?? adults[0]?.id ?? "";
                  return (
                    <RedeemableItemCard
                      key={key}
                      prestation={prestation}
                      selected={selected}
                      adults={adults}
                      assignedPersonId={assignedPersonId}
                      onToggle={() => onToggleItem(entry.entryId, prestation.id)}
                      onAssign={(personId) => onAssignItem(entry.entryId, prestation.id, personId)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 pb-6 text-center text-[14px] text-[var(--color-gray-400)] sm:pb-8">
          Sélectionnez celles que vous voulez utiliser aujourd&apos;hui.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--color-gray-100)] p-6 pt-4 sm:flex-row-reverse sm:p-8 sm:pt-4">
        <button
          type="button"
          onClick={onViewOtherServices}
          className="flex-1 rounded-full bg-[var(--core-brand-color)] px-8 py-3 text-[17px] font-[450] text-black shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition hover:opacity-90"
        >
          Voir les autres services
        </button>
        <button
          type="button"
          onClick={onSkipToCreneau}
          className="flex-1 rounded-full border border-[var(--color-border-light)] px-8 py-3 text-[17px] font-[450] text-[var(--color-gray-600)] transition hover:bg-[var(--color-gray-50)]"
        >
          Passer au créneau
        </button>
      </div>
    </Dialog>
  );
}
