import { cn } from "@/lib/prise-rdv/utils";
import { Button } from "@/components/prise-rdv/ui/button";

type StepFooterProps = {
  onBack: () => void;
  onContinue: () => void;
  backLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** Stacks the buttons full-width on mobile and reverses their order, matching the confirmation step's layout. */
  stacked?: boolean;
  className?: string;
};

/** The "back / continue" row repeated at the bottom of every booking step. */
export function StepFooter({
  onBack,
  onContinue,
  backLabel = "Retourner",
  continueLabel = "Continuer",
  continueDisabled = false,
  stacked = false,
  className,
}: StepFooterProps) {
  return (
    <div
      className={cn(
        stacked
          ? "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          : "flex items-center justify-between",
        className,
      )}
    >
      <Button
        type="button"
        onClick={onBack}
        variant="outline"
        className={cn(
          "border-[rgba(136,102,102,0.3)] px-6 py-2 text-[var(--brand-taupe-muted)] hover:bg-black/[.02]",
          stacked && "w-full py-3 sm:w-auto sm:py-2",
        )}
      >
        {backLabel}
      </Button>
      <Button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className={cn("px-8 py-2 disabled:opacity-50", stacked && "w-full py-3 sm:w-auto sm:min-w-[320px] sm:py-2")}
      >
        {continueLabel}
      </Button>
    </div>
  );
}
