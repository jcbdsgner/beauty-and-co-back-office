import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "success" | "warning" | "error" | "info";

const TONE: Record<AlertTone, { cls: string; Icon: typeof Info }> = {
  success: { cls: "alert-success", Icon: CheckCircle2 },
  warning: { cls: "alert-warning", Icon: AlertTriangle },
  error: { cls: "alert-error", Icon: XCircle },
  info: { cls: "alert-info", Icon: Info },
};

type AlertProps = {
  tone: AlertTone;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/** daisyUI `alert` (soft) — a persistent inline banner. Amber (`warning`) is the app's single
 *  "needs you" signal. */
export function Alert({ tone, title, description, action, className }: AlertProps) {
  const { cls, Icon } = TONE[tone];
  return (
    <div role="alert" className={cn("alert alert-soft items-start", cls, className)}>
      <Icon aria-hidden className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-sm text-base-content/70">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
