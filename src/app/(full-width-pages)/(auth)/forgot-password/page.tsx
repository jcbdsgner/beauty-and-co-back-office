import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Demander un lien de réinitialisation du mot de passe.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
