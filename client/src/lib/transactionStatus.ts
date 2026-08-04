import { TColor } from "@/vendor/facit/type/color-type";

/**
 * Ticket statuses as persisted on `pawn_transactions.status`, and the labels
 * the UI shows for them. Note `Blocked` is displayed as "Black Listed" — a
 * ticket gets that status from the Edit page, which also adds its customer to
 * the blacklist. Blacklisted tickets are read-only everywhere.
 */
export const BLACKLISTED_STATUS = "Blocked";

export const STATUS_LABEL: Record<string, string> = {
  Active: "Current",
  Overdue: "Outstanding",
  Completed: "Redemption",
  Profited: "Forfeited",
  Blocked: "Black Listed",
};

export const STATUS_COLOR: Record<string, TColor> = {
  Active: "primary",
  Completed: "secondary",
  Profited: "warning",
  Overdue: "danger",
  Blocked: "danger",
};

export const statusLabel = (status: string) => STATUS_LABEL[status] ?? status;
