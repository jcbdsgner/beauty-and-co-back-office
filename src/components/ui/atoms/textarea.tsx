import { cn } from "@/lib/utils";

type Tone = "cream" | "rose-soft" | "white";

const TONE_CLASS: Record<Tone, string> = {
  cream: "bg-base-200",
  "rose-soft": "bg-accent border-transparent",
  white: "bg-base-100",
};

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  tone?: Tone;
  className?: string;
};

/** daisyUI `textarea` — same focus language as TextInput. */
export function Textarea({ tone = "white", className, rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn("textarea w-full resize-none text-[15px]", TONE_CLASS[tone], className)}
      {...rest}
    />
  );
}
