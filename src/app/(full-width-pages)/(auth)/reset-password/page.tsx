import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Choisir un nouveau mot de passe.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
