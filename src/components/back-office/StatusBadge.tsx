import Badge from "@/components/ui/badge/Badge";

// Maps the free-text status strings used across the mock data onto Badge colors.
const TONE: Record<string, "success" | "warning" | "error" | "info" | "light" | "primary"> = {
  // positive / done
  Active: "success", Paid: "success", Published: "success", Succeeded: "success",
  Fulfilled: "success", Solved: "success", Connected: "success", Succeeded_: "success",
  // in progress / neutral-info
  Trialing: "info", Pending: "warning", Processing: "info", Open: "info",
  Invited: "info", Draft: "light", "Partially fulfilled": "warning", Unfulfilled: "warning",
  // attention
  "Past due": "warning", Overdue: "error", Failed: "error", Suspended: "error",
  Churned: "error", Cancelled: "error", Refunded: "error", Returned: "error",
  Closed: "light", Archived: "light",
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <Badge size="sm" color={TONE[value] ?? "light"}>
      {value}
    </Badge>
  );
}
