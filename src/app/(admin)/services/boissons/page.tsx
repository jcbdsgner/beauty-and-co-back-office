import type { Metadata } from "next";
import Services from "@/components/back-office/Services";

export const metadata: Metadata = {
  title: "Boissons — Services",
  description:
    "Carte du bar Beauty & Co — boissons, compositions, prix et disponibilité. Démo front-end, données fictives.",
};

export default function ServicesBoissonsPage() {
  return <Services section="boissons" />;
}
