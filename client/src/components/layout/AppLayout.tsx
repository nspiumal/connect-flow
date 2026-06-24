import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Loading..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <AppHeader />
      <main className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AppLayoutNoSidebar() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Loading..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <main className="flex-1 overflow-auto">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 space-y-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
