import { useEffect, useState, ReactNode } from "react";
import apiClient from "@/integrations/api";
import { AuthContext, AppRole, UserProfile } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
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
          setPermissions(userData.permissions || []);
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

      const userToStore: UserProfile & { permissions?: string[] } = {
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        branchId: userData.branchId,
        branch: userData.branch,
        permissions: userData.permissions || [],
      };

      console.log("Storing user data:", userToStore);
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("token", token);

      setUser(userToStore);
      setRole(userToStore.role || null);
      setBranchId(userToStore.branchId || null);
      setPermissions(userToStore.permissions || []);
      setProfile({ full_name: userToStore.fullName, email: userToStore.email });

      console.log("Login successful, user state updated");
    } catch (error) {
      console.error("Login failed:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setRole(null);
      setBranchId(null);
      setPermissions([]);
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
    setPermissions([]);
    setProfile(null);
  };

  const has = (permission: string) => role === "SUPERADMIN" || permissions.includes(permission);

  return (
    <AuthContext.Provider value={{ user, role, branchId, permissions, profile, loading, signIn, signOut, has }}>
      {children}
    </AuthContext.Provider>
  );
}
