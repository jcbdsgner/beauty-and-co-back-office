import { cn } from "@/lib/utils";

/**
 * daisyUI `badge` — something you read, not something you tap. Semantic tones render soft
 * (`badge-soft`) with a leading status dot; loyalty tiers render as a solid mini-flag.
 */
export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "vip"
  | "platinum"
  | "gold"
  | "silver"
  | "brand"
  | "dark"
  | "neutral"
  | "livraison";

const DOT_TONE: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
};

/** Dégradés métalliques des paliers de fidélité — réutilisées hors `Badge` (mini-drapeau du répertoire, carte). */
export const TIER_TONE: Record<"vip" | "platinum" | "gold" | "silver", string> = {
  vip: "bg-[image:var(--pos-tier-vip)] text-[var(--pos-tier-vip-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_0_0_1px_rgb(16_24_40/0.08)]",
  platinum: "bg-[image:var(--pos-tier-platinum)] text-[var(--pos-tier-platinum-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_0_0_1px_rgb(16_24_40/0.08)]",
  gold: "bg-[image:var(--pos-tier-gold)] text-[var(--pos-tier-gold-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_0_0_1px_rgb(16_24_40/0.08)]",
  silver: "bg-[image:var(--pos-tier-silver)] text-[var(--pos-tier-silver-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_0_0_1px_rgb(16_24_40/0.08)]",
};

const FLAG_TONE: Record<string, string> = {
  vip: `${TIER_TONE.vip} border-transparent`,
  platinum: `${TIER_TONE.platinum} border-transparent`,
  gold: `${TIER_TONE.gold} border-transparent`,
  silver: `${TIER_TONE.silver} border-transparent`,
  brand: "bg-primary text-primary-content border-transparent",
  dark: "bg-neutral text-neutral-content border-transparent",
  livraison: "bg-[var(--pos-fulfillment-livraison-soft)] text-base-content border-transparent text-[13px] font-medium",
};

const SOFT_TONE: Record<string, string> = {
  success: "badge-success badge-soft",
  warning: "badge-warning badge-soft",
  error: "badge-error badge-soft",
  info: "badge-info badge-soft",
  neutral: "badge-ghost",
};

type BadgeProps = {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = "neutral", icon, className, children }: BadgeProps) {
  const isFlag = variant in FLAG_TONE;

  return (
    <span
      className={cn(
        "badge gap-1.5 font-semibold whitespace-nowrap",
        isFlag ? FLAG_TONE[variant] : (SOFT_TONE[variant] ?? SOFT_TONE.neutral),
        className,
      )}
    >
      {icon ?? (DOT_TONE[variant] && <span className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[variant])} />)}
      {children}
    </span>
  );
}
