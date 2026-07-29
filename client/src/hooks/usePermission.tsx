import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { has } = useAuth();
  return has;
}

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Render-guard: `<Can permission="users.create"><Button/></Can>` */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { has } = useAuth();
  return has(permission) ? <>{children}</> : <>{fallback}</>;
}