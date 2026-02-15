import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import apiClient from "@/integrations/api";

export type AppRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "STAFF";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: AppRole;
  branchId?: string;
  branch?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: AppRole | null;
  branchId: string | null;
  profile: { full_name: string; email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users credentials
const DEMO_USERS: Record<string, { password: string; fullName: string; role: AppRole }> = {
  "superadmin@connectflow.com": { password: "SuperAdmin@123", fullName: "Super Administrator", role: "SUPERADMIN" },
  "admin@connectflow.com": { password: "Admin@123", fullName: "System Administrator", role: "ADMIN" },
  "manager@connectflow.com": { password: "Manager@123", fullName: "Branch Manager", role: "MANAGER" },
  "staff@connectflow.com": { password: "Staff@123", fullName: "Staff Member", role: "STAFF" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setRole(userData.role || null);
        setBranchId(userData.branch || null);
        setProfile({ full_name: userData.fullName, email: userData.email });
      }
    } catch (err) {
      console.error("Error loading stored user:", err);
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const demoUser = DEMO_USERS[email.toLowerCase()];
      if (!demoUser || demoUser.password !== password) {
        throw new Error("Invalid email or password");
      }

      const response = await apiClient.auth.login(email, password);
      const userData = response.user;
      const token = response.token;

      const userToStore: UserProfile = {
        id: userData.id || email,
        fullName: userData.fullName || demoUser.fullName,
        email: userData.email || email,
        phone: userData.phone,
        role: userData.role || demoUser.role,
        branchId: userData.branchId,
        branch: userData.branch,
      };

      localStorage.setItem("user", JSON.stringify(userToStore));
      if (token) {
        localStorage.setItem("token", token);
      }

      setUser(userToStore);
      setRole(userToStore.role || null);
      setBranchId(userToStore.branch || null);
      setProfile({ full_name: userToStore.fullName, email: userToStore.email });
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setRole(null);
      setBranchId(null);
      setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    setBranchId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, branchId, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
