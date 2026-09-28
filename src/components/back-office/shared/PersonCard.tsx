import Badge from "@/components/ui/badge/Badge";

// Ligne compacte avatar + nom + méta + badge — le bloc partagé par les
// résultats de ClientSearchField et par toute future liste de personnes du
// même genre (équipe, etc.). Inspiré de PersonCard côté point-de-vente.
// Initiales sur fond `accent` / encre `secondary`, comme l'`Avatar` de
// point-de-vente — pas la palette arc-en-ciel d'`AvatarText`, hors charte.

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

type Props = {
  name: string;
  meta?: string;
  badgeLabel?: string;
  badgeColor?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  trailing?: string;
  className?: string;
};

export default function PersonCard({
  name,
  meta,
  badgeLabel,
  badgeColor = "light",
  trailing,
  className = "",
}: Props) {
  return (
    <div className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-secondary">
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-base-content">{name}</span>
          {badgeLabel && (
            <Badge size="sm" color={badgeColor}>
              {badgeLabel}
            </Badge>
          )}
        </span>
        {meta && <span className="block truncate text-xs tabular-nums text-base-content/60">{meta}</span>}
      </span>
      {trailing && (
        <span className="shrink-0 text-xs font-medium text-base-content/60">{trailing}</span>
      )}
    </div>
  );
}
