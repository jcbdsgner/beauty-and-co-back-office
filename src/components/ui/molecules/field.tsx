import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + inline error in one place — the error slot is built into the wrapper so no
 *  form has to remember to render it somewhere else on the page. */
export function Field({ label, required, error, className, children }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-base-content/70">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {error && <span className="text-sm font-medium text-error">{error}</span>}
    </label>
  );
}
