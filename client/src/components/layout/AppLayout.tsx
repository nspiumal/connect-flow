import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Loading..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
