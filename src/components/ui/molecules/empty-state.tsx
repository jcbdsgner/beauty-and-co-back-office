import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * An empty screen is an invitation, not a dead end — the icon now sits in a soft dashed-circle
 * well (echoes the dashed "required field" affordance elsewhere in the app) instead of floating
 * bare on the page, so it reads as "nothing placed here yet" rather than "something broke."
 */
export function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-base-300 text-base-content/30 [&_svg]:size-8">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-[family-name:var(--font-heading)] font-semibold text-lg text-base-content/80">{title}</p>
        {subtitle && <p className="text-sm text-base-content/55">{subtitle}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
