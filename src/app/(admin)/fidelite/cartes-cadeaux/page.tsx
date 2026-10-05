import type { Metadata } from "next";
import { Suspense } from "react";
import CartesCadeaux from "@/components/back-office/CartesCadeaux";

export const metadata: Metadata = {
  title: "Cartes cadeaux — Fidélité",
  description:
    "Cartes cadeaux Beauty & Co vendues, par format (digitales / physiques) : envois, préparation, remise, soldes. Démo front-end, données fictives.",
};

export default function CartesCadeauxPage() {
  return (
    <Suspense fallback={null}>
      <CartesCadeaux />
    </Suspense>
  );
}
