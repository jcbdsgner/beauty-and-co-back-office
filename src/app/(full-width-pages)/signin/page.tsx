import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connexion au back-office Beauty & Co.",
};

export default function SignIn() {
  return <SignInForm />;
}
