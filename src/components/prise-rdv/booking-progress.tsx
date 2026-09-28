import Image from "next/image";
import { cn } from "@/lib/prise-rdv/utils";
import type { BookingStepId } from "@/lib/prise-rdv/types";

const steps: { id: BookingStepId; label: string }[] = [
  { id: "clientes", label: "Clientes" },
  { id: "services", label: "Services" },
  { id: "creneau", label: "Créneau" },
  { id: "confirmation", label: "Confirmation" },
];

type BookingProgressProps = {
  currentStep: BookingStepId;
};

export function BookingProgress({ currentStep }: BookingProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div>
      <ol className="mx-auto flex w-full max-w-3xl items-start">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center px-2">
              {index < steps.length - 1 && (
                <span aria-hidden className="absolute left-1/2 top-3 h-px w-full bg-[var(--color-gray-200)]" />
              )}
              <span
                className={cn(
                  "relative flex size-6 items-center justify-center rounded-full",
                  isDone || isActive ? "bg-[var(--core-brand-color)]" : "border border-[var(--color-gray-200)] bg-white",
                )}
              >
                {isDone ? (
                  <Image src="/images/rdv/icon-check.svg" alt="" width={14} height={14} />
                ) : (
                  <span
                    className={cn("size-2 rounded-full", isActive ? "bg-white" : "bg-[var(--color-gray-200)]")}
                  />
                )}
              </span>
              {/* Four full labels don't fit a phone-width row without wrapping or shrinking to
                  the point of illegibility, so mobile shows only the current step's name below
                  the dots instead (see caption underneath), and this label reappears from sm up. */}
              <span
                className={cn(
                  "mt-3 hidden text-[17px] font-bold sm:block",
                  isActive || isDone ? "text-[var(--color-gray-800)]" : "text-[var(--color-gray-500)]",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-[15px] font-bold text-[var(--color-gray-800)] sm:hidden">
        Étape {currentIndex + 1}/{steps.length} — {steps[currentIndex]?.label}
      </p>
    </div>
  );
}
