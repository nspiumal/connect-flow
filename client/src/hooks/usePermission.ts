import { useAuth } from "@/hooks/useAuth";

export function usePermission() {
  const { has } = useAuth();
  return has;
}
