import {
  LayoutDashboard, Building2, Users, FileText, Search, ShieldAlert,
  Percent, BarChart3, ClipboardList, LogOut, ChevronLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-500",
  ADMIN: "bg-orange-500",
  MANAGER: "bg-blue-500",
  STAFF: "bg-green-500",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Branch Manager",
  STAFF: "Staff",
};

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { title: "Branches", url: "/branches", icon: Building2, roles: ["SUPERADMIN", "ADMIN"] },
  { title: "Branch Requests", url: "/branch-requests", icon: ClipboardList, roles: ["SUPERADMIN", "ADMIN"] },
  { title: "Users", url: "/users", icon: Users, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { title: "Pawn Transactions", url: "/transactions", icon: FileText, roles: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { title: "Customer Search", url: "/customers", icon: Search, roles: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { title: "Blacklist", url: "/blacklist", icon: ShieldAlert, roles: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"] },
  { title: "Interest Rates", url: "/interest-rates", icon: Percent, roles: ["SUPERADMIN", "ADMIN"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList, roles: ["SUPERADMIN"] },
];

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className={cn(
      "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <span className="font-semibold text-sm">Gold Pawn</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {!collapsed && role && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", ROLE_COLORS[role])} />
            <span className="text-xs font-medium">{ROLE_LABELS[role]}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{profile?.full_name}</p>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full hover:bg-sidebar-accent transition-colors text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
