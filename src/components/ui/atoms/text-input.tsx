import { cn } from "@/lib/utils";

type Tone = "cream" | "rose-soft" | "white";
type Size = "field" | "compact";

const TONE_CLASS: Record<Tone, string> = {
  cream: "bg-base-200",
  "rose-soft": "bg-accent border-transparent",
  white: "bg-base-100",
};

const SIZE_CLASS: Record<Size, string> = {
  field: "input-md text-[15px]",
  compact: "input-sm text-sm",
};

type TextInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
  tone?: Tone;
  /** `field` (default, 56px) for a standalone form control; `compact` (44px) for an inline
   *  control packed next to other elements (e.g. a discount-code row). */
  size?: Size;
  className?: string;
};

/**
 * daisyUI `input`. On a touch counter there is no cursor hovering a field before a tap, so the
 * moment of focus announces itself: daisyUI's focus outline in the brand colour.
 */
export function TextInput({ tone = "white", size = "field", className, ...rest }: TextInputProps) {
  return (
    <input
      className={cn("input w-full", TONE_CLASS[tone], SIZE_CLASS[size], className)}
      {...rest}
    />
  );
}
