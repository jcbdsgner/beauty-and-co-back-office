"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";

// Bandeau de tête du tableau de bord (Figma node 286:8) : titre + filtre
// salon + action primaire « Nouveau RDV », sur le `PageHeader` commun à tous
// les écrans — voir cette entrée dans la carte du code. Distinct de
// `layout/AppHeader.tsx` (bascule sidebar + compte, ne change pas ici — la
// propriétaire garde son bouton de compte visible même si le Figma ne le
// montre pas).
//
// Écart volontaire au Figma : le mock montre des pastilles de période
// (Aujourd'hui/Cette semaine/Ce mois) à cet emplacement. Dans cette refonte,
// tout le contenu de la page (RDV du jour, KPIs du jour, prestations sur 30
// jours) est volontairement toujours « aujourd'hui »/« 30 derniers jours »
// (cf. TodayAppointments/TodayKpiCards/PopularServices) — aucune section ne
// réagit plus à une période choisie ici, donc les pastilles n'auraient rien
// piloté. Une pastille qui ne fait rien perd la propriétaire (cf. design.md,
// persona Sokhna Ndour — « les patterns inhabituels la perdent »). À la
// place : le filtre salon, bien réel lui, que le Figma n'a pas besoin de
// montrer (son mock ne modélise qu'un seul salon).
const SALON_PILLS: { value: SalonScope; label: string }[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

export default function DashboardHeader({
  scope,
  onScopeChange,
}: {
  scope: SalonScope;
  onScopeChange: (s: SalonScope) => void;
}) {
  return (
    <PageHeader
      title="Tableau de bord"
      actions={
        <>
          <SegmentedControl
            options={SALON_PILLS}
            value={scope}
            onChange={onScopeChange}
            aria-label="Filtrer par salon"
            variant="tinted"
          />
          <Link
            href="/rendez-vous?nouveau=1"
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Plus className="h-[14px] w-[14px]" />
            Nouveau rendez-vous
          </Link>
        </>
      }
    />
  );
}
