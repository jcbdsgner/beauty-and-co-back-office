import Link from "next/link";
import React from "react";
import { Alert as PdvAlert } from "@/components/ui/molecules/alert";

// Enveloppe historique (`variant` / `message` / lien optionnel) conservée pour
// ses consommateurs — le rendu est désormais l'`Alert` de point-de-vente
// (daisyUI `alert alert-soft`), à préférer directement dans le nouveau code.
interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  showLink = false,
  linkHref = "#",
  linkText = "En savoir plus",
}) => (
  <PdvAlert
    tone={variant}
    title={title}
    description={message}
    action={
      showLink ? (
        <Link href={linkHref} className="text-sm font-semibold underline">
              {linkText}
            </Link>
      ) : undefined
}
        />
  );

export default Alert;
