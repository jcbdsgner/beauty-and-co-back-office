import { bookingServices } from "@/lib/prise-rdv/data/booking-services";
import { getPackPrice, packs } from "@/lib/prise-rdv/data/packs";
import type { CartItem, PackGroupInfo, PersonTab } from "@/lib/prise-rdv/types";
import { toSentenceCase } from "@/lib/prise-rdv/utils";

/** Maps each person's id to the set of subService ids they've selected. */
export type Selections = Record<string, Set<string>>;

/** Prestation ids covered for free by an owned Pack or an active Abonnement, keyed by whichever attendee that redemption was assigned to (see AlreadyPaidDialog), with which of the two it came from. Empty when no Pack or Abonnement applies to this booking. */
export type PrestationCoverage = Map<string, Map<string, "pack" | "abonnement">>;

const noCoverage: PrestationCoverage = new Map();

export function buildCartItems(
  people: PersonTab[],
  selections: Selections,
  coverage: PrestationCoverage = noCoverage,
): CartItem[] {
  const items: CartItem[] = [];

  for (const person of people) {
    const selectedIds = selections[person.id];
    if (!selectedIds || selectedIds.size === 0) continue;

    // A Pack's prestations group together and bill at the Pack's discounted price as soon as
    // every one of them is selected for this person — not just when picked from the pack upsell,
    // so unchecking then rechecking a service on the services step ungroups/regroups on its own.
    // Skipped when every one of its prestations is already covered for free (owned Pack/Abonnement)
    // — nothing left to discount there.
    const packGroupBySubServiceId = new Map<string, PackGroupInfo>();
    for (const pack of packs) {
      if (!pack.prestationIds.every((id) => selectedIds.has(id))) continue;
      const allCovered = pack.prestationIds.every((id) => coverage.get(person.id)?.get(id));
      if (allCovered) continue;
      const groupInfo: PackGroupInfo = { packId: pack.id, packLabel: pack.label, groupPrice: getPackPrice(pack) };
      for (const id of pack.prestationIds) packGroupBySubServiceId.set(id, groupInfo);
    }

    for (const service of bookingServices) {
      for (const sub of service.subServices) {
        if (!selectedIds.has(sub.id)) continue;

        const coverageSource = coverage.get(person.id)?.get(sub.id) ?? null;
        const packGroup = packGroupBySubServiceId.get(sub.id) ?? null;
        // Only the first not-otherwise-covered prestation encountered for a given group actually
        // carries its price, so the group's total isn't counted once per prestation in it.
        const isFirstPricedInGroup =
          packGroup && !coverageSource
            ? !items.some(
                (item) => item.personId === person.id && item.packGroup?.packId === packGroup.packId && !item.coverageSource,
              )
            : false;

        items.push({
          id: `${person.id}:${sub.id}`,
          personId: person.id,
          personLabel: person.label,
          categoryId: service.id,
          categoryLabel: service.label,
          subServiceId: sub.id,
          label: toSentenceCase(sub.label),
          price: coverageSource ? 0 : packGroup ? (isFirstPricedInGroup ? packGroup.groupPrice : 0) : sub.price,
          originalPrice: sub.price,
          duration: sub.duration,
          durationMinutes: sub.durationMinutes,
          twoPractitionersEligible: sub.twoPractitionersEligible,
          coverageSource,
          packGroup,
        });
      }
    }
  }

  return items;
}

// Soin du visage, épilation, spa and head spa (a Coiffure subcategory) are only performed at
// Almadies — Sea Plaza has no room for them. Head spa has no category of its own, so it's
// matched by subcategory instead.
const ALMADIES_ONLY_CATEGORY_IDS = new Set(["soin-du-visage", "epilation", "spa"]);
const HEAD_SPA_SUB_SERVICE_IDS = new Set(
  bookingServices
    .flatMap((service) => service.subServices)
    .filter((sub) => sub.subcategory === "Head Spa")
    .map((sub) => sub.id),
);

/** True when the booking includes at least one prestation only available at Almadies. */
export function requiresAlmadiesOnly(cartItems: CartItem[]): boolean {
  return cartItems.some(
    (item) => ALMADIES_ONLY_CATEGORY_IDS.has(item.categoryId) || HEAD_SPA_SUB_SERVICE_IDS.has(item.subServiceId),
  );
}

export type CartDisplayGroup = {
  key: string;
  personId: string;
  personLabel: string;
  pack: { id: string; label: string; price: number };
  items: CartItem[];
};

/** Splits a cart's items into ones grouped under a fully-selected Pack (see buildCartItems) and
 *  the rest — for display layers (summary sidebar, confirmation recap) that show each completed
 *  Pack as one block instead of listing its prestations among the others. */
export function groupCartItemsByPack(cartItems: CartItem[]): {
  grouped: CartDisplayGroup[];
  ungrouped: CartItem[];
} {
  const grouped: CartDisplayGroup[] = [];
  const groupByKey = new Map<string, CartDisplayGroup>();
  const ungrouped: CartItem[] = [];

  for (const item of cartItems) {
    if (!item.packGroup) {
      ungrouped.push(item);
      continue;
    }

    const key = `${item.personId}:${item.packGroup.packId}`;
    let group = groupByKey.get(key);
    if (!group) {
      group = {
        key,
        personId: item.personId,
        personLabel: item.personLabel,
        pack: { id: item.packGroup.packId, label: item.packGroup.packLabel, price: item.packGroup.groupPrice },
        items: [],
      };
      groupByKey.set(key, group);
      grouped.push(group);
    }
    group.items.push(item);
  }

  return { grouped, ungrouped };
}
