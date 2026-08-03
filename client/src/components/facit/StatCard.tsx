import { ReactNode } from "react";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Icon from "@/vendor/facit/components/icon/Icon";
import { TColor } from "@/vendor/facit/type/color-type";
import { TIcons } from "@/vendor/facit/type/icons-type";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: TIcons;
  iconColor?: TColor;
  description?: string;
}

/** Replaces the widget-array -> Card-grid pattern duplicated across the 4 dashboard components. */
export function StatCard({ title, value, icon, iconColor = "primary", description }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="d-flex align-items-center justify-content-between">
          <div className="min-w-0">
            <div className="text-muted text-uppercase small fw-bold text-truncate">{title}</div>
            <div className="fs-3 fw-bold">{value}</div>
            {description && <div className="text-muted small">{description}</div>}
          </div>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-l10-${iconColor}`}
            style={{ width: 48, height: 48 }}
          >
            <Icon icon={icon} size="lg" color={iconColor} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
