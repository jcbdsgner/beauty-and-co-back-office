import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// daisyUI `btn` base. One brand colour (#886666) carries every accent role: both `brand` and
// `dark` are filled taupe (no dark-brown neutral fill on buttons); semantic fills stay separate.
export type ButtonVariant =
  | "brand"
  | "dark"
  | "outline"
  | "lilac"
  | "success"
  | "info"
  | "danger"
  | "danger-outline";

export const buttonVariants = cva(
  // Touch-first counter station: every tap gets a felt press (active:scale — hover never
  // registers on a touchscreen); a disabled control stays a legible muted fill, never an
  // opacity wash.
  cn(
    "btn normal-case",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "active:scale-[0.97]",
    "disabled:!bg-base-200 disabled:!text-base-content/40 disabled:!border-transparent disabled:!shadow-none disabled:scale-100",
    "aria-disabled:pointer-events-none aria-disabled:!bg-base-200 aria-disabled:!text-base-content/40 aria-disabled:scale-100",
  ),
  {
    variants: {
      variant: {
        brand: "btn-primary",
        dark: "btn-primary",
        outline: "btn-outline border-base-300 text-secondary hover:!bg-base-200 hover:!border-base-300 hover:!text-secondary",
        lilac: "border-transparent bg-[var(--brand-lilac)] text-base-content/70 hover:brightness-95",
        success: "btn-success",
        info: "btn-info",
        danger: "btn-error",
        "danger-outline": "btn-outline btn-error",
      },
      size: {
        // daisyUI heights scale from --size-field (0.35rem): md ≈ 56px, lg ≈ 67px, sm ≈ 45px.
        // Weight follows Figma 255:2: the everyday in-card action pair (md) reads Medium; the
        // page-level CTAs (sm header pill, lg counter bar) stay SemiBold.
        default: "btn-md text-[16px] font-medium",
        xl: "btn-lg text-[17px] font-semibold",
        sm: "btn-sm text-[15px] font-semibold",
        icon: "btn-md btn-square font-semibold",
      },
    },
    defaultVariants: { variant: "brand", size: "default" },
  },
);

type CommonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  /** Set when href leaves this site (a separate Beauty and Co property). Opens in a new tab with an external-link cue. */
  external?: boolean;
  /** Hide the external-link arrow cue even when `external` is set (target/rel still apply). */
  hideExternalIcon?: boolean;
};

type ActionButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export type ButtonProps = LinkButtonProps | ActionButtonProps;

export function Button(props: ButtonProps) {
  const { children, icon, variant = "brand", size = "default", className } = props;
  const classes = cn(buttonVariants({ variant, size }), className);

  if (props.href) {
    const { href, external = false, hideExternalIcon = false } = props;
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {icon}
        {children}
        {external && !hideExternalIcon && <ArrowUpRight aria-hidden className="size-4 shrink-0" />}
      </Link>
    );
  }

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stripped so they aren't spread onto the DOM button
    href, variant: _v, size: _s, className: _c, icon: _i, children: _ch, type = "button", ...buttonRest
  } = props as ActionButtonProps;

  return (
    <button type={type} className={classes} {...buttonRest}>
      {icon}
      {children}
    </button>
  );
}
