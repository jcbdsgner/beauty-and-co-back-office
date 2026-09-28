import { Avatar } from "@/components/ui/atoms/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/atoms/badge";
import { cn } from "@/lib/utils";

type PersonCardProps = {
  initial: string;
  name: string;
  meta?: string;
  badge?: { label: string; variant: BadgeVariant };
  trailing?: string;
  online?: boolean;
  onClick?: () => void;
  className?: string;
};

/**
 * A person, at a glance — the avatar leads at face-stand-in scale with any tier flag as a corner
 * badge on it, the name is the row's bold headline, meta is the one supporting line. Used in the
 * répertoire grid, the équipe annuaire, and the cliente search results.
 */
export function PersonCard({ initial, name, meta, badge, trailing, online, onClick, className }: PersonCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-box border border-border bg-white p-4 text-left transition",
        onClick && "active:scale-[0.98] hover:border-secondary hover:bg-accent/30 outline-none focus-visible:border-secondary",
        className,
      )}
    >
      <span className="relative shrink-0">
        <Avatar initial={initial} size={52} className="bg-accent text-lg font-semibold text-secondary" />
        {online && <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-white bg-success" />}
        {badge && (
          <span className="absolute -top-1.5 -left-1.5">
            <Badge variant={badge.variant} className="px-1.5 py-0.5 text-xs shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]">
              {badge.label}
            </Badge>
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-[family-name:var(--font-heading)] font-semibold text-[15px] text-base-content">{name}</span>
        {meta && <span className="mt-0.5 block truncate text-sm text-base-content/55">{meta}</span>}
      </span>
      {trailing && <span className="shrink-0 text-xs font-medium text-base-content/45 tabular-nums">{trailing}</span>}
    </Comp>
  );
}
