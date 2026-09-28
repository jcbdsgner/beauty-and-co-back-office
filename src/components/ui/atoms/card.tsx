import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The resting, flat surface — daisyUI box radius, a hairline `base-300` border as the only
 * signal it sits on the page. Real elevation belongs to Dialog alone.
 */
export function Card({ className, ...rest }: CardProps) {
  return (
    <div className={cn("rounded-box border border-base-300 bg-base-100 text-base-content", className)} {...rest} />
  );
}
