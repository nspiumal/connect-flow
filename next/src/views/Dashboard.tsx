import { useAuth } from "@/contexts/AuthContext";
import { SuperAdminDashboard } from "@/components/dashboards/SuperAdminDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { StaffDashboard } from "@/components/dashboards/StaffDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  switch (role) {
    case "SUPERADMIN": return <SuperAdminDashboard />;
    case "ADMIN": return <AdminDashboard />;
    case "MANAGER": return <ManagerDashboard />;
    case "STAFF": return <StaffDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      );
  }
}
