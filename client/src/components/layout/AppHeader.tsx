import {
  LayoutDashboard, Building2, Users, FileText, Search, ShieldAlert,
  Percent, BarChart3, ClipboardList, LogOut, ChevronDown, Menu, X, FilePlus, Package, Activity,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-500 shadow-red-500/20",
  ADMIN: "bg-orange-500 shadow-orange-500/20",
  MANAGER: "bg-blue-500 shadow-blue-500/20",
  STAFF: "bg-green-500 shadow-green-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Branch Manager",
  STAFF: "Staff",
};

interface NavSubItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavCategory {
  id: string;
  title: string;
  items: NavSubItem[];
}

export function AppHeader() {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Grouped items matching the structure
  const categories: NavCategory[] = [
    {
      id: "file",
      title: "FILE",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"] },
        { title: "Reports", url: "/reports", icon: BarChart3, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
      ],
    },
    {
      id: "items",
      title: "ITEMS",
      items: [
        { title: "Item Types", url: "/item-types", icon: Package, roles: ["ADMIN"] },
      ],
    },
    {
      id: "tickets",
      title: "TICKETS",
      items: [
        { title: "Add Ticket", url: "/transactions/create", icon: FilePlus, roles: ["ADMIN", "MANAGER", "STAFF"] },
        { title: "View Tickets", url: "/transactions", icon: FileText, roles: ["ADMIN", "MANAGER", "STAFF"] },
      ],
    },
    {
      id: "customers",
      title: "CUSTOMERS",
      items: [
        { title: "Customer Search", url: "/customers", icon: Search, roles: ["ADMIN", "MANAGER", "STAFF"] },
        { title: "Blacklist", url: "/blacklist", icon: ShieldAlert, roles: ["ADMIN", "MANAGER", "STAFF"] },
      ],
    },
    {
      id: "config",
      title: "CONFIG",
      items: [
        { title: "Branches", url: "/branches", icon: Building2, roles: ["SUPERADMIN", "ADMIN"] },
        { title: "Branch Requests", url: "/branch-requests", icon: ClipboardList, roles: ["SUPERADMIN", "ADMIN"] },
        { title: "Interest Rates", url: "/interest-rates", icon: Percent, roles: ["ADMIN"] },
      ],
    },
    {
      id: "privileges",
      title: "PRIVILEGES",
      items: [
        { title: "Users", url: "/users", icon: Users, roles: ["ADMIN", "MANAGER"] },
        { title: "Activity Logs", url: "/activity-logs", icon: Activity, roles: ["SUPERADMIN", "ADMIN"] },
        { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList, roles: ["SUPERADMIN"] },
      ],
    },
  ];

  // Filter categories and items based on role
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((cat) => cat.items.length > 0);

  // Auto-detect active category based on current pathname
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedCat = filteredCategories.find((cat) =>
      cat.items.some((item) => {
        if (item.url === "/dashboard" && currentPath === "/dashboard") return true;
        if (item.url !== "/dashboard" && currentPath.startsWith(item.url)) return true;
        return false;
      })
    );

    if (matchedCat) {
      setActiveCategory(matchedCat.id);
    } else if (filteredCategories.length > 0 && !activeCategory) {
      setActiveCategory(filteredCategories[0].id);
    }
  }, [location.pathname, role]);

  const activeCategoryData = filteredCategories.find((cat) => cat.id === activeCategory);

  return (
    <header className="w-full bg-background border-b z-50 flex flex-col transition-all duration-300">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-sidebar text-sidebar-foreground min-h-[52px] sm:min-h-[60px] md:h-16 shadow-md relative z-20">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs sm:text-sm">KHJ</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-sm block leading-none">Kalyani House of Jewellers</span>
            <span className="text-[10px] text-sidebar-foreground/60">Gold Pawn</span>
          </div>
        </div>

        {/* Desktop Top Menu Tabs */}
        <nav className="hidden md:flex items-center h-full px-2 lg:px-4 overflow-x-auto scrollbar-none flex-1 justify-center">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "relative px-2 lg:px-4 py-2 mx-0.5 lg:mx-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 flex items-center gap-1 whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <span>{cat.title}</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 lg:w-3.5 lg:h-3.5 opacity-55 transition-transform duration-200",
                  activeCategory === cat.id && "rotate-180"
                )}
              />
            </button>
          ))}
        </nav>

        {/* User profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {role && (
            <div className="hidden lg:flex flex-col items-end border-r border-sidebar-border/50 pr-4">
              <div className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", ROLE_COLORS[role] || "bg-gray-400")} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/80">
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <span className="text-xs text-sidebar-foreground/60 max-w-[120px] truncate font-medium mt-0.5">
                {profile?.full_name}
              </span>
            </div>
          )}

          {/* Quick Sign Out (Desktop) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="hidden md:flex items-center gap-1.5 lg:gap-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors font-semibold text-xs px-2 lg:px-3 h-8 lg:h-9"
          >
            <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop Submenu Bar (Expands / slides open from the top) */}
      <div
        className={cn(
          "w-full bg-muted/30 border-b border-border/50 overflow-hidden transition-all duration-300 hidden md:block z-10",
          activeCategoryData && activeCategoryData.items.length > 0
            ? "max-h-16 opacity-100 py-2 sm:py-3"
            : "max-h-0 opacity-0 py-0 border-b-0"
        )}
      >
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 flex flex-wrap items-center gap-1 sm:gap-2 md:gap-3">
          {activeCategoryData?.items.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs font-semibold text-muted-foreground transition-all duration-200 border border-transparent hover:bg-background hover:text-foreground hover:shadow-sm whitespace-nowrap"
              activeClassName="bg-primary text-white hover:bg-primary hover:text-white shadow-sm border-primary/20"
            >
              <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
          {activeCategory === "file" && (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors border border-transparent whitespace-nowrap"
            >
              <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer/Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sidebar text-sidebar-foreground border-b border-sidebar-border/50 flex flex-col p-4 space-y-4 animate-accordion-down z-30">
          {role && (
            <div className="flex items-center justify-between border-b border-sidebar-border/50 pb-3 bg-sidebar-accent/10 px-2 py-1.5 rounded-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 block">Logged in as</span>
                <span className="text-sm font-semibold">{profile?.full_name}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-sidebar-accent px-2.5 py-1 rounded-full">
                <span className={cn("w-2 h-2 rounded-full", ROLE_COLORS[role] || "bg-gray-400")} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{ROLE_LABELS[role]}</span>
              </div>
            </div>
          )}

          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <span className="text-[10px] font-extrabold tracking-widest text-sidebar-foreground/40 block px-2 uppercase">
                  {cat.title}
                </span>
                <div className="grid grid-cols-1 gap-1 pl-2">
                  {cat.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white transition-colors font-semibold"
                      activeClassName="bg-primary text-white hover:bg-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-sidebar-border/50 pt-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-md text-xs w-full hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 font-bold"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
