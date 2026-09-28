import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const SIZE_CLASS = { sm: "loading-sm", md: "loading-md", lg: "loading-lg" };

/** Indeterminate loading indicator — daisyUI `loading loading-spinner`, in the brand colour. */
export function Spinner({ size = "md", className, label = "Chargement…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("loading loading-spinner text-primary", SIZE_CLASS[size], className)}
    />
  );
}
