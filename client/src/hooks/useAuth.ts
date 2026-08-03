import { createContext, useContext } from "react";

// Widened from the old 4-value union: Super Admin can create custom roles now,
// so any role name the backend returns must be accepted here.
export type AppRole = string;

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: AppRole;
  branchId?: string;
  branch?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  role: AppRole | null;
  branchId: string | null;
  permissions: string[];
  profile: { full_name: string; email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** True if the current role has this permission key. SUPERADMIN always passes. */
  has: (permission: string) => boolean;
}

// The context object and this hook live here rather than next to AuthProvider so
// that `contexts/AuthContext.tsx` exports a component and nothing else — mixing
// the two in one file breaks React Fast Refresh.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
