import React, { ReactNode } from "react";
import { Button as PdvButton } from "@/components/ui/atoms/button";

// Enveloppe historique (API TailAdmin : `size` / `variant` / `startIcon` /
// `endIcon`) conservée pour ses consommateurs — le rendu est désormais le
// `Button` de point-de-vente (`@/components/ui/atoms/button`, daisyUI `btn`),
// à préférer directement dans le nouveau code.
interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => (
  <PdvButton
    type={type}
    variant={variant === "primary" ? "brand" : "outline"}
    size={size === "sm" ? "sm" : "default"}
    icon={startIcon}
      onClick={onClick}
      disabled={disabled}
    className={className}
    >
      {children}
      {endIcon}
    </PdvButton>
  );

export default Button;
