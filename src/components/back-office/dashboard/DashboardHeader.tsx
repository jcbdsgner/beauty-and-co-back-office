"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { buttonVariants } from "@/components/ui/atoms/button";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";
import { todayTitle } from "@/components/back-office/dashboard/today";

// Bandeau de tête de l'accueil : la date du jour en titre (c'est la question
// que pose un coup d'œil — « où en est aujourd'hui ? »), filtre salon et la
// seule action pleine de la page, « Nouveau rendez-vous » (les réservations
// arrivent encore par téléphone et WhatsApp).
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
      title={todayTitle}
      actions={
        <>
          <SegmentedControl
            options={SALON_PILLS}
            value={scope}
            onChange={onScopeChange}
            aria-label="Filtrer par salon"
            variant="tinted"
          />
          <Link href="/rendez-vous?nouveau=1" className={`${buttonVariants({ size: "sm" })} gap-2`}>
            <Plus className="size-4" aria-hidden />
            Nouveau rendez-vous
          </Link>
        </>
      }
    />
  );
}
