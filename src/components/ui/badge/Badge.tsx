import React from "react";
import { Badge as PdvBadge, type BadgeVariant as PdvVariant } from "@/components/ui/atoms/badge";
import { cn } from "@/lib/utils";

// Enveloppe historique (API TailAdmin : `variant` light/solid + `color`)
// conservée pour ses consommateurs — le rendu est désormais le `Badge` de
// point-de-vente (daisyUI `badge`, tons « soft » + point de statut), à
// préférer directement dans le nouveau code.
type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

// light → ton soft de point-de-vente ; `primary` (rôles, marque) n'a pas
// d'équivalent soft là-bas : fond `accent` + encre `accent-content`, la paire
// rosée de son thème.
const LIGHT: Record<BadgeColor, { variant: PdvVariant; className?: string }> = {
  primary: { variant: "neutral", className: "bg-accent text-accent-content border-transparent" },
  success: { variant: "success" },
  error: { variant: "error" },
  warning: { variant: "warning" },
  info: { variant: "info" },
  light: { variant: "neutral" },
  dark: { variant: "dark" },
  };

const SOLID: Record<BadgeColor, string> = {
  primary: "",
  success: "bg-success text-success-content",
  error: "bg-error text-error-content",
  warning: "bg-warning text-warning-content",
  info: "bg-info text-info-content",
  light: "bg-base-300 text-base-content",
  dark: "bg-neutral text-neutral-content",
  };

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const mapped =
    variant === "solid"
      ? { variant: "brand" as PdvVariant, className: SOLID[color] }
      : LIGHT[color];
  return (
    <PdvBadge
      variant={mapped.variant}
      icon={startIcon}
      className={cn(size === "sm" && "badge-sm", mapped.className)}
    >
      {children}
      {endIcon}
    </PdvBadge>
  );
};

export default Badge;
