import { useAuth } from "@/hooks/useAuth";
import { SuperAdminDashboard } from "@/components/dashboards/SuperAdminDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { StaffDashboard } from "@/components/dashboards/StaffDashboard";
import { t } from "@/lib/lang";

export default function Dashboard() {
  const { role } = useAuth();

  switch (role) {
    case "SUPERADMIN": return <SuperAdminDashboard />;
    case "ADMIN": return <AdminDashboard />;
    case "MANAGER": return <ManagerDashboard />;
    case "STAFF": return <StaffDashboard />;
    default:
      return (
        <div className="d-flex align-items-center justify-content-center" style={{ height: 256 }}>
          <p className="text-muted">{t("LOADING_DASHBOARD")}</p>
        </div>
      );
  }
}
