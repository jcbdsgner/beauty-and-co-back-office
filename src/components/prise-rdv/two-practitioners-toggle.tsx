"use client";

import { cn } from "@/lib/prise-rdv/utils";
import { formatDurationMinutes } from "@/lib/prise-rdv/format";
import { Switch } from "@/components/prise-rdv/ui/switch";

type TwoPractitionersToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  soloMinutes: number;
  twoPractitionersMinutes: number;
};

export function TwoPractitionersToggle({
  enabled,
  onChange,
  soloMinutes,
  twoPractitionersMinutes,
}: TwoPractitionersToggleProps) {
  return (
    <div className={cn("mt-4 rounded-2xl bg-[rgba(253,207,202,0.35)] p-[18px]", !enabled && "attention-shake-once")}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[17px] text-[var(--color-gray-800)]">
            <span className="font-bold text-[var(--brand-taupe-muted)]">Gagner 2 fois plus de temps</span> avec 2 praticiens,
            gratuitement.
            {soloMinutes > 0 && (
              <>
                {" "}
                Votre rendez-vous passera de {formatDurationMinutes(soloMinutes)} à{" "}
                <span className="font-bold">{formatDurationMinutes(twoPractitionersMinutes)}</span>.
              </>
            )}
          </p>
        </div>

        <Switch checked={enabled} onChange={onChange} label="Activer 2 praticiens" />
      </div>
    </div>
  );
}
