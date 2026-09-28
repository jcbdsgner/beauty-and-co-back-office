"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CategoryPrestationList } from "@/components/prise-rdv/category-prestation-list";
import { CategoryTiles } from "@/components/prise-rdv/category-tiles";
import { PersonToggle } from "@/components/prise-rdv/person-toggle";
import { StepFooter } from "@/components/prise-rdv/steps/step-footer";
import { bookingServices, type BookingService, type BookingSubService } from "@/lib/prise-rdv/data/booking-services";
import { formatPrice } from "@/lib/prise-rdv/format";
import type { PrestationCoverage, Selections } from "@/lib/prise-rdv/cart";
import {
  answerKey,
  isCategoryQuestionsComplete,
  personHasIncompleteQuestions,
  selectedCategoryIds,
  type QuestionAnswers,
} from "@/lib/prise-rdv/questions";
import type { PersonTab } from "@/lib/prise-rdv/types";
import { cn, toSentenceCase } from "@/lib/prise-rdv/utils";

type Suggestion = { category: BookingService; sub: BookingSubService; targetPeople: PersonTab[] };

function categoryAppliesToPerson(category: BookingService, person: PersonTab) {
  return Boolean(category.forChildren) === (person.type === "child");
}

// Cross-sell nudge, shared across the whole booking rather than per person: for each category,
// if at least one eligible attendee (matching its adult/child audience) has nothing from it yet,
// suggest its first prestation — offered to every eligible attendee of that audience together
// (all adults, or all children), never to a subset of them, so two adults never see one of them
// get a suggestion the other doesn't.
//
// Slots are only ever dropped/replaced by a selection made outside this block (i.e. straight from
// the main prestation list) — see the effect below. Taking a suggestion via its own button just
// flips that button to "Sélectionné", it never removes or swaps the card.
function nextSuggestions(
  previous: Suggestion[],
  people: PersonTab[],
  selections: Selections,
  max = 2,
): Suggestion[] {
  const kept = previous.filter((suggestion) =>
    suggestion.targetPeople.some((person) => !selections[person.id]?.has(suggestion.sub.id)),
  );

  const next = [...kept];
  const coveredCategoryIds = new Set(next.map((suggestion) => suggestion.category.id));

  for (const category of bookingServices) {
    if (next.length >= max) break;
    if (coveredCategoryIds.has(category.id)) continue;

    const eligiblePeople = people.filter((person) => categoryAppliesToPerson(category, person));
    if (eligiblePeople.length === 0) continue;

    const hasGap = eligiblePeople.some(
      (person) => !category.subServices.some((sub) => selections[person.id]?.has(sub.id)),
    );
    if (!hasGap) continue;

    const sub = category.subServices[0];
    if (!sub) continue;

    next.push({ category, sub, targetPeople: eligiblePeople });
  }

  return next;
}

type ServicesStepProps = {
  people: PersonTab[];
  selections: Selections;
  onToggleSubService: (personId: string, subServiceId: string) => void;
  questionAnswers: QuestionAnswers;
  onAnswerQuestion: (personId: string, categoryId: string, questionId: string, value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  /** Prestations already paid for by an owned Pack or an active Abonnement this booking, per attendee (see AlreadyPaidDialog). */
  coverage?: PrestationCoverage;
};

export function ServicesStep({
  people,
  selections,
  onToggleSubService,
  questionAnswers,
  onAnswerQuestion,
  onContinue,
  onCancel,
  coverage,
}: ServicesStepProps) {
  // The attendees dialog can still be open (people === []) when this step first mounts, so
  // a plain useState default would lock onto a stale/empty id — fall back to people[0] at
  // render time whenever the manually selected id isn't (or is no longer) a real person.
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const activePersonId =
    selectedPersonId && people.some((person) => person.id === selectedPersonId)
      ? selectedPersonId
      : (people[0]?.id ?? "");

  const activePerson = people.find((person) => person.id === activePersonId);

  // Mini & Co is exclusively for children, and it's the only category children can book.
  const availableServices = useMemo(
    () =>
      activePerson?.type === "child"
        ? bookingServices.filter((service) => service.forChildren)
        : bookingServices.filter((service) => !service.forChildren),
    [activePerson],
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const activeCategoryId =
    selectedCategoryId && availableServices.some((service) => service.id === selectedCategoryId)
      ? selectedCategoryId
      : (availableServices[0]?.id ?? "");
  const [showMissingSelectionWarning, setShowMissingSelectionWarning] = useState(false);
  const [showMissingQuestionsWarning, setShowMissingQuestionsWarning] = useState(false);
  const [highlightPersonId, setHighlightPersonId] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<"person" | "category" | "questions" | null>(null);
  const personToggleRef = useRef<HTMLDivElement>(null);
  const prestationListRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  const activeCategory =
    availableServices.find((service) => service.id === activeCategoryId) ?? availableServices[0];
  const activeSelection = selections[activePersonId] ?? new Set<string>();

  const categoriesWithSelection = useMemo(() => {
    const ids = new Set<string>();
    for (const service of availableServices) {
      if (service.subServices.some((sub) => activeSelection.has(sub.id))) {
        ids.add(service.id);
      }
    }
    return ids;
  }, [availableServices, activeSelection]);

  // Cross-sell nudge, shared across the whole booking (not per person) — see nextSuggestions.
  const [dismissedUpsell, setDismissedUpsell] = useState(false);
  const [hasInteractedWithSuggestions, setHasInteractedWithSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // Adjust state during render (React's documented alternative to an Effect here, using state
  // rather than a ref so it stays render-safe): comparing against the previous `selections`
  // reference lets us react to a real selection change without an extra render/commit cycle.
  const [prevSelections, setPrevSelections] = useState(selections);
  // Set right before calling onToggleSubService from inside the suggestion block itself, so the
  // check below can tell "picked from the suggestion card" (skip — freeze the list) apart from
  // "picked from the main list" (drop that slot's fulfilled target and top up with a new gap).
  const [pendingSelfToggle, setPendingSelfToggle] = useState(false);
  if (selections !== prevSelections) {
    setPrevSelections(selections);
    if (pendingSelfToggle) {
      setPendingSelfToggle(false);
    } else {
      // Nothing to suggest against until someone has committed to at least one prestation.
      const hasAnySelection = Object.values(selections).some((set) => set.size > 0);
      if (hasAnySelection) {
        setSuggestions(nextSuggestions(suggestions, people, selections));
      }
    }
  }

  const handleSuggestionToggle = (personId: string, subServiceId: string) => {
    setPendingSelfToggle(true);
    setHasInteractedWithSuggestions(true);
    onToggleSubService(personId, subServiceId);
  };

  const showUpsell = suggestions.length > 0 && !dismissedUpsell;

  const peopleMissingSelection = people.filter((person) => !selections[person.id]?.size);
  const peopleMissingQuestions = people.filter((person) =>
    personHasIncompleteQuestions(person.id, selections[person.id], questionAnswers),
  );

  // After a "Continuer" click surfaces a warning, bring the relevant part of the step into view
  // instead of leaving the user to hunt for it: the required-questions block if it's the active
  // person/category that's incomplete, or the person toggle (highlighted) if someone else needs
  // attention first. Switching person/category here re-renders before this effect runs, so the
  // scroll always lands on the right target.
  useEffect(() => {
    if (!scrollTarget) return;
    if (scrollTarget === "person") {
      personToggleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (scrollTarget === "questions") {
      // "start" (not "center") so the required-questions block actually reaches the top of the
      // viewport — centering the whole (sometimes long) prestation list could leave it off-screen.
      questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      prestationListRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Recopié tel quel du site b&co (ADR 0032).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollTarget(null);
  }, [scrollTarget, activePersonId, activeCategoryId]);

  const handleContinue = () => {
    // Answering required questions for prestations already chosen takes priority over nudging
    // the user toward picking prestations for someone else — finish what's in front of you first.
    if (peopleMissingQuestions.length > 0) {
      setShowMissingQuestionsWarning(true);
      const incompletePerson =
        peopleMissingQuestions.find((person) => person.id === activePersonId) ?? peopleMissingQuestions[0];
      const incompleteCategoryId = [...selectedCategoryIds(selections[incompletePerson.id] ?? new Set())].find(
        (categoryId) =>
          !isCategoryQuestionsComplete(categoryId, questionAnswers[answerKey(incompletePerson.id, categoryId)]),
      );
      if (incompletePerson.id !== activePersonId) setSelectedPersonId(incompletePerson.id);
      if (incompleteCategoryId && incompleteCategoryId !== activeCategoryId) {
        setSelectedCategoryId(incompleteCategoryId);
      }
      setScrollTarget("questions");
      return;
    }
    const otherPersonMissingSelection = peopleMissingSelection.find((person) => person.id !== activePersonId);
    if (otherPersonMissingSelection) {
      setShowMissingSelectionWarning(true);
      setHighlightPersonId(otherPersonMissingSelection.id);
      setScrollTarget("person");
      return;
    }
    if (peopleMissingSelection.length > 0) {
      setShowMissingSelectionWarning(true);
      setScrollTarget("category");
      return;
    }
    onContinue();
  };

  return (
    <div>
      <h2 className="text-[21px] font-bold text-[var(--color-gray-800)]">Choisir vos services</h2>
      <p className="mt-1 text-[19px] text-[var(--color-gray-500)]">
        Choisissez les services que vous souhaitez recevoir.
      </p>

      {(() => {
        const activePersonFreeCount = coverage?.get(activePersonId)?.size ?? 0;
        if (activePersonFreeCount === 0) return null;
        return (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[rgba(237,220,218,0.35)] px-4 py-3">
            <Image src="/images/rdv/icon-price-tag.svg" alt="" width={20} height={20} className="shrink-0" />
            <p className="text-[15px] font-[450] text-[var(--brand-taupe-muted)]">
              <span className="font-bold">Vos avantages</span> appliqués — {activePersonFreeCount} prestation
              {activePersonFreeCount > 1 ? "s" : ""} déjà payée{activePersonFreeCount > 1 ? "s" : ""} pour{" "}
              {people.find((person) => person.id === activePersonId)?.label ?? "vous"}.
            </p>
          </div>
        );
      })()}

      <div ref={personToggleRef} className="mt-4">
        <PersonToggle
          people={people}
          activePersonId={activePersonId}
          onChange={(personId) => {
            setSelectedPersonId(personId);
            setHighlightPersonId(null);
          }}
          highlightPersonId={highlightPersonId}
        />
      </div>

      <div className="mt-6">
        <CategoryTiles
          services={availableServices}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setSelectedCategoryId}
          categoriesWithSelection={categoriesWithSelection}
        />
      </div>

      <div ref={prestationListRef} className="mt-6">
        <CategoryPrestationList
          category={activeCategory}
          selectedSubServiceIds={activeSelection}
          onToggleSubService={(subServiceId) => onToggleSubService(activePersonId, subServiceId)}
          questionAnswers={questionAnswers[answerKey(activePersonId, activeCategoryId)] ?? {}}
          onAnswerQuestion={(questionId, value) =>
            onAnswerQuestion(activePersonId, activeCategoryId, questionId, value)
          }
          showQuestionErrors={showMissingQuestionsWarning}
          questionsRef={questionsRef}
          coverageBySubServiceId={coverage?.get(activePersonId)}
        />
      </div>

      {showUpsell && (
        <div
          className={cn(
            "mt-6 rounded-2xl border border-[rgba(136,102,102,0.15)] bg-[rgba(237,220,218,0.25)] px-4 py-3",
            !hasInteractedWithSuggestions && "attention-shake",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-[450] text-[var(--color-gray-500)]">Beaucoup ajoutent aussi :</p>
            <button
              type="button"
              onClick={() => {
                setDismissedUpsell(true);
                setHasInteractedWithSuggestions(true);
              }}
              aria-label="Fermer la suggestion"
              className="shrink-0 text-[19px] leading-none text-[var(--color-gray-400)] transition hover:text-[var(--color-gray-500)]"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {suggestions.map(({ category, sub, targetPeople }) => (
              <div
                key={`${category.id}:${sub.id}`}
                className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-[rgba(136,102,102,0.2)] bg-white px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(237,220,218,0.6)]">
                    <Image
                      src={category.image}
                      alt=""
                      width={category.iconOnly ? 18 : 32}
                      height={category.iconOnly ? 18 : 32}
                      className={category.iconOnly ? undefined : "size-full object-cover"}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-[var(--color-gray-800)]" title={toSentenceCase(sub.label)}>
                      {toSentenceCase(sub.label)}
                    </p>
                    <p className="text-[13px] font-[500] text-[var(--color-gray-800)]">
                      {sub.duration} · {formatPrice(sub.price)}
                    </p>
                  </div>
                </div>
                {targetPeople.length === 1 ? (
                  (() => {
                    const person = targetPeople[0];
                    const isAdded = Boolean(selections[person.id]?.has(sub.id));
                    return (
                      <button
                        type="button"
                        onClick={() => handleSuggestionToggle(person.id, sub.id)}
                        aria-pressed={isAdded}
                        className={cn(
                          "shrink-0 self-start rounded-full border border-[var(--brand-taupe-muted)] px-3 py-1.5 text-[15px] font-[450] whitespace-nowrap transition",
                          isAdded ? "bg-[var(--brand-taupe-muted)] text-white" : "bg-white text-[var(--brand-taupe-muted)] hover:bg-[var(--brand-taupe-muted)]/5",
                        )}
                      >
                        {isAdded ? "Sélectionné" : "Sélectionner"}
                      </button>
                    );
                  })()
                ) : (
                  <div>
                    <p className="text-[13px] text-[var(--color-gray-500)]">Sélectionner pour :</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {targetPeople.map((person) => {
                        const isAdded = Boolean(selections[person.id]?.has(sub.id));
                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => handleSuggestionToggle(person.id, sub.id)}
                            aria-pressed={isAdded}
                            className={cn(
                              "shrink-0 rounded-full border border-[var(--brand-taupe-muted)] px-3 py-1.5 text-[15px] font-[450] whitespace-nowrap transition",
                              isAdded ? "bg-[var(--brand-taupe-muted)] text-white" : "bg-white text-[var(--brand-taupe-muted)] hover:bg-[var(--brand-taupe-muted)]/5",
                            )}
                          >
                            {person.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        {showMissingSelectionWarning && peopleMissingSelection.length > 0 && (
          <p className="mb-4 rounded-xl bg-[rgba(217,45,32,0.08)] px-4 py-3 text-[15px] font-[450] text-[var(--color-error)]">
            {peopleMissingSelection.length === people.length
              ? "Choisissez au moins une prestation pour continuer."
              : `${peopleMissingSelection.map((person) => person.label).join(" et ")} ${
                  peopleMissingSelection.length > 1 ? "doivent" : "doit"
                } choisir au moins une prestation pour continuer.`}
          </p>
        )}
        {showMissingQuestionsWarning && peopleMissingSelection.length === 0 && peopleMissingQuestions.length > 0 && (
          <p className="mb-4 rounded-xl bg-[rgba(217,45,32,0.08)] px-4 py-3 text-[15px] font-[450] text-[var(--color-error)]">
            {peopleMissingQuestions.length === people.length
              ? "Merci de répondre aux informations complémentaires obligatoires pour continuer."
              : `${peopleMissingQuestions.map((person) => person.label).join(" et ")} ${
                  peopleMissingQuestions.length > 1 ? "doivent" : "doit"
                } répondre aux informations complémentaires obligatoires pour continuer.`}
          </p>
        )}
        <StepFooter onBack={onCancel} onContinue={handleContinue} backLabel="Annuler" />
      </div>
    </div>
  );
}
