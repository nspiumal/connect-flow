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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        console.log("Auth initialization - User found:", !!storedUser, "Token found:", !!storedToken);

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          console.log("Loaded user from storage:", userData.email, "Role:", userData.role);
          setUser(userData);
          setRole(userData.role || null);
          setBranchId(userData.branchId || null);
          setProfile({ full_name: userData.fullName, email: userData.email });
        } else {
          console.log("No stored user or token found");
        }
      } catch (err) {
        console.error("Error loading stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Attempting login for:", email);
      // Call backend authentication API
      const response = await apiClient.auth.login(email, password);
      console.log("Login response received:", response);

      const userData = response.user;
      const token = response.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      const userToStore: UserProfile = {
        id: userData.id || email,
        fullName: userData.fullName,
        email: userData.email || email,
        phone: userData.phone,
        role: userData.role,
        branchId: userData.branchId,
        branch: userData.branch,
      };

      console.log("Storing user data:", userToStore);
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("token", token);

      setUser(userToStore);
      setRole(userToStore.role || null);
      setBranchId(userToStore.branchId || null);
      setProfile({ full_name: userToStore.fullName, email: userToStore.email });

      console.log("Login successful, user state updated");
    } catch (error) {
      console.error("Login failed:", error);
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
