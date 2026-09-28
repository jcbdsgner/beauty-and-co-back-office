import { cn } from "@/lib/prise-rdv/utils";

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
  "aria-label": string;
};

/** Unstyled-by-default icon-only button: centers its content and requires an aria-label, since there's no visible text for assistive tech to read. Visual treatment (size, shape, colors) is left to the caller via className. */
export function IconButton({ className, children, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cn("inline-flex items-center justify-center transition", className)} {...rest}>
      {children}
    </button>
  );
}

type CloseButtonProps = Omit<IconButtonProps, "children" | "aria-label"> & {
  "aria-label"?: string;
};

/** The "×" dismiss control used in the top-right corner of dialogs. */
export function CloseButton({ className, "aria-label": ariaLabel = "Fermer", ...rest }: CloseButtonProps) {
  return (
    <IconButton
      aria-label={ariaLabel}
      className={cn(
        "absolute top-3 right-3 size-9 rounded-lg text-xl leading-none text-[var(--color-gray-400)] hover:bg-black/[.03] hover:text-[var(--color-gray-500)]",
        className,
      )}
      {...rest}
    >
      ×
    </IconButton>
  );
}
