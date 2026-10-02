"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import SalonFilter from "@/components/back-office/shared/SalonFilter";
import { buttonVariants } from "@/components/ui/atoms/button";
import { type SalonScope } from "@/lib/mock/beautyandco";
import { todayTitle } from "@/components/back-office/dashboard/today";

// Bandeau de tête de l'accueil : la date du jour en titre (c'est la question
// que pose un coup d'œil — « où en est aujourd'hui ? »), filtre salon et la
// seule action pleine de la page, « Nouveau rendez-vous » (les réservations
// arrivent encore par téléphone et WhatsApp).

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
          <SalonFilter value={scope} onChange={onScopeChange} />
          <Link href="/rendez-vous?nouveau=1" className={`${buttonVariants({ size: "sm" })} gap-2`}>
            <Plus className="size-4" aria-hidden />
            Nouveau rendez-vous
          </Link>
        </>
      }
    />
  );
}
