import { bookingServices } from "@/lib/prise-rdv/data/booking-services";

/** Answers keyed by `${personId}:${categoryId}`, then by question id. */
export type QuestionAnswers = Record<string, Record<string, string>>;

export function answerKey(personId: string, categoryId: string): string {
  return `${personId}:${categoryId}`;
}

function categoryIdForSubService(subServiceId: string): string | null {
  for (const service of bookingServices) {
    if (service.subServices.some((sub) => sub.id === subServiceId)) return service.id;
  }
  return null;
}

export function selectedCategoryIds(selectedSubServiceIds: Set<string>): Set<string> {
  const ids = new Set<string>();
  for (const subServiceId of selectedSubServiceIds) {
    const categoryId = categoryIdForSubService(subServiceId);
    if (categoryId) ids.add(categoryId);
  }
  return ids;
}

export function isCategoryQuestionsComplete(
  categoryId: string,
  answers: Record<string, string> | undefined,
): boolean {
  const category = bookingServices.find((service) => service.id === categoryId);
  const questions = category?.requiredQuestions ?? [];
  return questions.every((question) => (answers?.[question.id] ?? "").trim() !== "");
}

export function personHasIncompleteQuestions(
  personId: string,
  selectedSubServiceIds: Set<string> | undefined,
  questionAnswers: QuestionAnswers,
): boolean {
  if (!selectedSubServiceIds || selectedSubServiceIds.size === 0) return false;
  for (const categoryId of selectedCategoryIds(selectedSubServiceIds)) {
    if (!isCategoryQuestionsComplete(categoryId, questionAnswers[answerKey(personId, categoryId)])) {
      return true;
    }
  }
  return false;
}
