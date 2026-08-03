import showNotification from "@/vendor/facit/components/extras/showNotification";
import Icon from "@/vendor/facit/components/icon/Icon";
import { TColor } from "@/vendor/facit/type/color-type";
import { TIcons } from "@/vendor/facit/type/icons-type";

export type NotifyVariant = "default" | "success" | "destructive" | "warning" | "info";

const VARIANT_META: Record<NotifyVariant, { icon: TIcons; color: TColor; type: "default" | "success" | "danger" | "warning" | "info" }> = {
  default: { icon: "Info", color: "primary", type: "default" },
  success: { icon: "CheckCircle", color: "success", type: "success" },
  destructive: { icon: "Error", color: "danger", type: "danger" },
  warning: { icon: "Warning", color: "warning", type: "warning" },
  info: { icon: "Info", color: "info", type: "info" },
};

interface NotifyOptions {
  title: string;
  description?: string;
  variant?: NotifyVariant;
}

/**
 * Replaces shadcn's `useToast()` — same call shape (`title`/`description`/
 * `variant`), backed by Facit's `showNotification` (react-notifications-
 * component). `variant="destructive"` matches the shadcn toast convention
 * used throughout the app for error states.
 */
export function notify({ title, description, variant = "default" }: NotifyOptions) {
  const { icon, color, type } = VARIANT_META[variant];
  showNotification(
    <span className="d-flex align-items-center">
      <Icon icon={icon} size="lg" color={color} className="me-2" />
      <span>{title}</span>
    </span>,
    description ?? "",
    type,
  );
}
