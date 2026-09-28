import { cn } from "@/lib/utils";

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
  "aria-label": string;
};

/** Unstyled-by-default icon-only button: centers its content and requires an aria-label, since there's no visible text for assistive tech to read. Visual treatment (size, shape, colors) is left to the caller via className — this is a touch-only desktop app, so every caller must size at least `size-12` (48px) and add its own `active:` press feedback (hover alone doesn't register on a tap). */
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

/** The "×" dismiss control used in the top-right corner of dialogs. size-12 (48px) — a comfortable corner tap target. */
export function CloseButton({ className, "aria-label": ariaLabel = "Fermer", ...rest }: CloseButtonProps) {
  return (
    <IconButton
      aria-label={ariaLabel}
      className={cn(
        "absolute top-2 right-2 size-12 rounded-field text-xl leading-none text-base-content/45 transition active:scale-90 active:bg-base-content/[.06] hover:bg-base-content/[.03] hover:text-base-content/60",
        className,
      )}
      {...rest}
    >
      ×
    </IconButton>
  );
}
