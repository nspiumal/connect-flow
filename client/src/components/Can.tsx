import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

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
