import type { Metadata } from "next";
import EmailTemplates from "@/components/back-office/EmailTemplates";

export const metadata: Metadata = {
  title: "Modèles d'email",
  description:
    "Texte des emails envoyés aux clientes Beauty & Co (confirmation, rappels, remerciement…), lien du site et délais d'envoi. Démo front-end, données fictives.",
};

export default function EmailsModelesPage() {
  return <EmailTemplates />;
}
