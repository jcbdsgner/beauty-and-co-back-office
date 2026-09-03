import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | Homonyme",
  description: "Request a password reset link.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
