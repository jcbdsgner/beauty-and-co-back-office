"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { preferenceQuestionSeeds, type PreferenceQuestion } from "@/lib/mock/preferences";
import { rubricOf } from "@/lib/mock/preference-targets";

// Configuration des préférences clientes (2026-09-27) — les questions et leurs
// options, définies dans Réglages › Préférences clientes et lues par la fiche
// cliente, sa dialog d'édition et la fiche rendez-vous. État de session (PAS de
// persistance), même famille que `PlanningContext` / `ClientsContext`.

type PreferencesContextType = {
  questions: PreferenceQuestion[];
  upsertQuestion: (q: PreferenceQuestion) => void;
  deleteQuestion: (id: string) => void;
  /** Décale une question d'un cran dans sa rubrique (-1 = monter). */
  moveQuestion: (id: string, delta: -1 | 1) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferenceConfig = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferenceConfig doit être utilisé dans un PreferencesProvider");
  return ctx;
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<PreferenceQuestion[]>(preferenceQuestionSeeds);

  const upsertQuestion = useCallback((q: PreferenceQuestion) => {
    setQuestions((list) =>
      list.some((x) => x.id === q.id) ? list.map((x) => (x.id === q.id ? q : x)) : [...list, q],
    );
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((list) => list.filter((x) => x.id !== id));
  }, []);

  const moveQuestion = useCallback((id: string, delta: -1 | 1) => {
    setQuestions((list) => {
      const q = list.find((x) => x.id === id);
      if (!q) return list;
      const rubric = rubricOf(q);
      const same = list.filter((x) => rubricOf(x) === rubric);
      const k = same.findIndex((x) => x.id === id);
      const target = same[k + delta];
      if (!target) return list;
      const a = list.indexOf(q);
      const b = list.indexOf(target);
      const next = [...list];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ questions, upsertQuestion, deleteQuestion, moveQuestion }),
    [questions, upsertQuestion, deleteQuestion, moveQuestion],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
