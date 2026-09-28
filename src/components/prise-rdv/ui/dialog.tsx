import { cn } from "@/lib/prise-rdv/utils";

type DialogProps = {
  open: boolean;
  labelledBy: string;
  role?: "dialog" | "alertdialog";
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

/** Shared fixed-overlay + centered-panel shell for the app's modals. Only the structural boilerplate (positioning, centering, aria wiring) is fixed — border, radius, shadow, width and overlay tint stay per-dialog via className/overlayClassName since they currently differ between dialogs. */
export function Dialog({ open, labelledBy, role = "dialog", overlayClassName, className, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4", overlayClassName)}>
      <div role={role} aria-modal="true" aria-labelledby={labelledBy} className={cn("w-full bg-white", className)}>
        {children}
      </div>
    </div>
  );
}
