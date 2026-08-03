import Badge from "@/vendor/facit/components/bootstrap/Badge";
import { TColor } from "@/vendor/facit/type/color-type";

// Transaction lifecycle statuses (see PawnTransaction.status in the backend).
const STATUS_COLOR: Record<string, TColor> = {
  Active: "success",
  Overdue: "danger",
  Completed: "secondary",
};

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, TColor>;
}

/** Replaces the inline status->badge IIFE previously duplicated per page (e.g. Transactions.tsx). */
export function StatusBadge({ status, colorMap = STATUS_COLOR }: StatusBadgeProps) {
  return (
    <Badge color={colorMap[status] ?? "secondary"} isLight rounded="pill">
      {status}
    </Badge>
  );
}
