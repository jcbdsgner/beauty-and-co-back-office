import type { Metadata } from "next";
import Messagerie from "@/components/back-office/Messagerie";

export const metadata: Metadata = {
  title: "Messagerie",
  description:
    "Appels, SMS, WhatsApp et chat des clientes Beauty & Co, réunis dans une seule boîte de réception. Démo front-end, données fictives.",
};

export default function MessageriePage() {
  return <Messagerie />;
}
