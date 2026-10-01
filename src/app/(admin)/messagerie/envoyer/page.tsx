import type { Metadata } from "next";
import { Suspense } from "react";
import EnvoyerMessage from "@/components/back-office/messagerie/EnvoyerMessage";

export const metadata: Metadata = {
  title: "Envoyer un message",
  description: "Envoi d'un message aux clientes Beauty & Co par email, SMS ou WhatsApp. Démo front-end, rien n'est envoyé.",
};

export default function EnvoyerPage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (?client=<id>).
  return (
    <Suspense fallback={null}>
      <EnvoyerMessage />
    </Suspense>
  );
}
