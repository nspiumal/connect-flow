import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  permission: string;
  children: ReactNode;
}

/**
 * Route guard: redirects to /dashboard when the current role lacks `permission`.
 * Closes the gap where a hidden nav item was still reachable by typing its URL.
 */
export function RequirePermission({ permission, children }: Props) {
  const { has, loading } = useAuth();
  if (loading) return null;
  if (!has(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
