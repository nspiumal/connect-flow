import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "./AppHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// Pages bring their own PageWrapper > SubHeader > Page (Facit grammar), which
// supplies its own container gutters, so <main> itself carries no padding —
// matching Facit's own Content/PageWrapper layering. The small p-3/p-md-4
// here is a transitional fallback for pages not yet migrated off their old
// hand-rolled wrapper divs; harmless double-padding once a page adopts Page.
export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Loading..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="d-flex flex-column min-vh-100 w-100">
      <AppHeader />
      <main className="flex-grow-1 overflow-auto">
        <div className="p-3 p-md-4">
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
    <div className="d-flex min-vh-100 w-100">
      <main className="flex-grow-1 overflow-auto">
        <div className="px-3 px-md-4 py-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
