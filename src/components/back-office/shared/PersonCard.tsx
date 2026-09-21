import Badge from "@/components/ui/badge/Badge";

// Ligne compacte avatar + nom + méta + badge — le bloc partagé par les
// résultats de ClientSearchField et par toute future liste de personnes du
// même genre (équipe, etc.). Inspiré de PersonCard côté point-de-vente.
// Initiales sur fond `brand-50` / texte `brand-700`, comme le reste du
// back-office (ClientsTable, EquipeList…) — pas la palette arc-en-ciel
// d'`AvatarText`, hors charte.

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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-700">
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-theme-sm font-medium text-gray-800">{name}</span>
          {badgeLabel && (
            <Badge size="sm" color={badgeColor}>
              {badgeLabel}
            </Badge>
          )}
        </span>
        {meta && <span className="block truncate text-theme-xs tabular-nums text-gray-500">{meta}</span>}
      </span>
      {trailing && (
        <span className="shrink-0 text-theme-xs font-medium text-gray-500">{trailing}</span>
      )}
    </div>
  );
}
