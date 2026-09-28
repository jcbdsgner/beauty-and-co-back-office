import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Loading placeholder block — daisyUI `skeleton` (pulsing flat fill), box radius by default. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div className={cn("skeleton rounded-box", className)} {...rest} />;
}
