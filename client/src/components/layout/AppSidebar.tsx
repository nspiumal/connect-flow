import {
  LayoutDashboard, Building2, Users, FileText, Search, ShieldAlert,
  Percent, BarChart3, ClipboardList, LogOut, ChevronLeft, FilePlus, Package,
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
  { title: "Users", url: "/users", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { title: "Item Types", url: "/item-types", icon: Package, roles: ["ADMIN"] },
  { title: "Interest Rates", url: "/interest-rates", icon: Percent, roles: ["ADMIN"] },
  { title: "Pawn Transaction Creation", url: "/transactions/create", icon: FilePlus, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { title: "Pawn Transaction History", url: "/transactions", icon: FileText, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { title: "Customer Search", url: "/customers", icon: Search, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { title: "Blacklist", url: "/blacklist", icon: ShieldAlert, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList, roles: ["SUPERADMIN"] },
];

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className={cn(
      "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0 shadow-lg",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <div>
              <span className="font-bold text-sm block">Connect Flow</span>
              <span className="text-xs text-sidebar-foreground/60">Gold Pawn</span>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 hover:bg-sidebar-accent">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {!collapsed && role && (
        <div className="px-4 py-3.5 border-b border-sidebar-border/50 bg-sidebar-accent/30">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", ROLE_COLORS[role])} />
            <span className="text-xs font-semibold uppercase tracking-wider">{ROLE_LABELS[role]}</span>
          </div>
          <p className="text-xs text-sidebar-foreground/70 mt-2 truncate font-medium">{profile?.full_name}</p>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors font-medium"
            activeClassName="text-sidebar-foreground/80"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border/50">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 font-medium"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
