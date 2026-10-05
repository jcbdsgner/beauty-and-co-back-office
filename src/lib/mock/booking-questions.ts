import type { RdvQuestion } from "@/lib/mock/rendezvous";

/**
 * Les questions obligatoires de la prise de rendez-vous b&co (`requiredQuestions`), posées une fois
 * par personne et par catégorie — libellés et ids verbatim, repris de point-de-vente
 * (`lib/data/booking-questions.ts`). Clés = ids des services du back-office (`serviceSeeds`).
 */
export type BookingQuestion = { id: string; type: "yesno" | "text"; label: string };

export const BOOKING_QUESTIONS: Record<string, BookingQuestion[]> = {
  "s-coiffure": [
    { id: "tresses-a-retirer", type: "yesno", label: "Avez-vous des tresses à retirer ?" },
    { id: "voilee", type: "yesno", label: "Êtes-vous voilée ?" },
    { id: "propres-extensions", type: "yesno", label: "Apporterez-vous vos propres extensions ?" },
  ],
  "s-manucure": [
    { id: "vernis-permanent-ou-gel-a-retirer", type: "yesno", label: "Avez-vous un vernis permanent ou un gel à retirer ?" },
    { id: "allergique-produits", type: "yesno", label: "Êtes-vous allergique à certains produits ? (merci de préciser sur la note interne)" },
    { id: "diabetique", type: "yesno", label: "Êtes-vous diabétique ?" },
  ],
  "s-spa": [
    { id: "supporte-chaleur", type: "yesno", label: "Supportez-vous la chaleur ?" },
    { id: "asthmatique", type: "yesno", label: "Êtes-vous asthmatique ?" },
    { id: "choix-huile", type: "text", label: "Quel choix d'huile souhaitez-vous ?" },
    { id: "zone-douleur", type: "text", label: "Où ressentez-vous la douleur ?" },
  ],
  "s-visage": [
    { id: "type-peau", type: "text", label: "Quel type de peau avez-vous ? (Sensible, Grasse ou Mixte)" },
  ],
};

/** Réponses en cours de saisie, par `${personKey}:${serviceId}` puis par id de question. */
export type RdvAnswers = Record<string, Record<string, string>>;

export const rdvAnswerKey = (personKey: string, serviceId: string) => `${personKey}:${serviceId}`;

// Dans `RdvDetail.questions` (liste à plat), une réponse b&co porte l'id
// `bq:<personne>:<service>:<question>` — ce qui permet de la relire à la modification.
// Les autres questions (fixtures historiques) sont gardées telles quelles.
const PREFIX = "bq:";

export function answersFromQuestions(questions: RdvQuestion[]): RdvAnswers {
  const out: RdvAnswers = {};
  for (const q of questions) {
    if (!q.id.startsWith(PREFIX) || !q.answer) continue;
    const rest = q.id.slice(PREFIX.length);
    const qSep = rest.lastIndexOf(":");
    const sSep = rest.lastIndexOf(":", qSep - 1);
    if (qSep < 0 || sSep < 0) continue;
    const k = rdvAnswerKey(rest.slice(0, sSep), rest.slice(sSep + 1, qSep));
    out[k] = { ...(out[k] ?? {}), [rest.slice(qSep + 1)]: q.answer };
  }
  return out;
}

/** Les questions b&co d'un rendez-vous, une par personne × catégorie × question (sans réponse = `null`). */
export function questionsFromAnswers(
  people: { key: string; label: string; serviceIds: string[] }[],
  answers: RdvAnswers,
  kept: RdvQuestion[],
): RdvQuestion[] {
  const several = people.length > 1;
  const asked = people.flatMap((p) =>
    p.serviceIds.flatMap((sid) =>
      (BOOKING_QUESTIONS[sid] ?? []).map((q) => {
        const value = answers[rdvAnswerKey(p.key, sid)]?.[q.id]?.trim() ?? "";
        return {
          id: `${PREFIX}${p.key}:${sid}:${q.id}`,
          question: several ? `${q.label} · ${p.label}` : q.label,
          answer: value || null,
        };
      }),
    ),
  );
  return [...kept.filter((q) => !q.id.startsWith(PREFIX)), ...asked];
}
