import {
  LayoutDashboard, Building2, Users, FileText, Search, ShieldAlert,
  Percent, BarChart3, ClipboardList, FilePlus, Package, Activity, KeyRound,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Icon from "@/vendor/facit/components/icon/Icon";
import OffCanvas, {
  OffCanvasHeader,
  OffCanvasTitle,
  OffCanvasBody,
} from "@/vendor/facit/components/bootstrap/OffCanvas";
import useDarkMode from "@/vendor/facit/hooks/useDarkMode";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, "danger" | "warning" | "info" | "success"> = {
  SUPERADMIN: "danger",
  ADMIN: "warning",
  MANAGER: "info",
  STAFF: "success",
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
  permission: string;
}

interface NavCategory {
  id: string;
  title: string;
  items: NavSubItem[];
}

export function AppHeader() {
  const { role, profile, signOut } = useAuth();
  const has = usePermission();
  const location = useLocation();
  const { darkModeStatus, setDarkModeStatus } = useDarkMode();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Grouped items matching the structure
  const categories: NavCategory[] = [
    {
      id: "file",
      title: "FILE",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
        { title: "Reports", url: "/reports", icon: BarChart3, permission: "reports.view" },
      ],
    },
    {
      id: "items",
      title: "ITEMS",
      items: [
        { title: "Item Types", url: "/item-types", icon: Package, permission: "itemTypes.view" },
      ],
    },
    {
      id: "tickets",
      title: "TICKETS",
      items: [
        { title: "Add Ticket", url: "/transactions/create", icon: FilePlus, permission: "tickets.create" },
        { title: "View Tickets", url: "/transactions", icon: FileText, permission: "tickets.view" },
      ],
    },
    {
      id: "customers",
      title: "CUSTOMERS",
      items: [
        { title: "Customer Search", url: "/customers", icon: Search, permission: "customers.view" },
        { title: "Blacklist", url: "/blacklist", icon: ShieldAlert, permission: "blacklist.view" },
      ],
    },
    {
      id: "config",
      title: "CONFIG",
      items: [
        { title: "Branches", url: "/branches", icon: Building2, permission: "branches.view" },
        { title: "Branch Requests", url: "/branch-requests", icon: ClipboardList, permission: "branchRequests.view" },
        { title: "Interest Rates", url: "/interest-rates", icon: Percent, permission: "interestRates.view" },
      ],
    },
    {
      id: "privileges",
      title: "PRIVILEGES",
      items: [
        { title: "Users", url: "/users", icon: Users, permission: "users.view" },
        { title: "Roles & Permissions", url: "/roles", icon: KeyRound, permission: "roles.manage" },
        { title: "Activity Logs", url: "/activity-logs", icon: Activity, permission: "activityLogs.view" },
        { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList, permission: "auditLogs.view" },
      ],
    },
  ];

  // Filter categories and items based on the current role's granted permissions
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => has(item.permission)),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, role]);

  const activeCategoryData = filteredCategories.find((cat) => cat.id === activeCategory);

  return (
    <header className="w-100 border-bottom shadow-sm" style={{ position: "relative", zIndex: 50 }}>
      {/* Top Navbar */}
      <div
        className="d-flex align-items-center justify-content-between px-3 px-md-4 py-2 text-white"
        style={{ background: "var(--bs-dark)", minHeight: 60 }}
      >
        {/* Logo and Brand */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <div
            className="d-flex align-items-center justify-content-center rounded shadow"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, var(--bs-primary), var(--bs-info))",
            }}
          >
            <span className="fw-bold text-white small">KHJ</span>
          </div>
          <div className="d-none d-sm-block lh-sm">
            <span className="fw-bold small d-block">Kalyani House of Jewellers</span>
            <span className="text-white-50" style={{ fontSize: "0.6875rem" }}>Gold Pawn</span>
          </div>
        </div>

        {/* Desktop Top Menu Tabs */}
        <nav className="d-none d-md-flex align-items-center h-100 flex-grow-1 justify-content-center overflow-auto px-3">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "btn btn-sm mx-1 text-uppercase fw-bold d-flex align-items-center gap-1 text-nowrap",
                activeCategory === cat.id ? "btn-primary text-white shadow-sm" : "btn-link text-white-50"
              )}
              style={{ fontSize: "0.75rem", letterSpacing: "0.03em" }}
            >
              {cat.title}
            </button>
          ))}
        </nav>

        {/* User profile & Actions */}
        <div className="d-flex align-items-center gap-2 gap-lg-3 flex-shrink-0">
          {role && (
            <div className="d-none d-lg-flex flex-column align-items-end border-end pe-3" style={{ borderColor: "rgba(255,255,255,.15) !important" }}>
              <div className="d-flex align-items-center gap-2">
                <Badge color={ROLE_COLORS[role] || "secondary"} rounded="pill" className="text-uppercase" style={{ fontSize: "0.625rem" }}>
                  {ROLE_LABELS[role] || role}
                </Badge>
              </div>
              <span className="text-white-50 small mt-1 text-truncate" style={{ maxWidth: 140 }}>
                {profile?.full_name}
              </span>
            </div>
          )}

          {/* Dark mode toggle */}
          <Button
            className="d-none d-md-inline-flex text-white"
            onClick={() => setDarkModeStatus((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            <Icon icon={darkModeStatus ? "LightMode" : "DarkMode"} size="lg" />
          </Button>

          {/* Quick Sign Out (Desktop) */}
          <Button
            className="d-none d-md-inline-flex text-danger fw-semibold"
            onClick={signOut}
            icon="Logout"
          >
            Sign Out
          </Button>

          {/* Mobile Menu Button */}
          <Button
            className="d-md-none text-white"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icon icon="Menu" size="lg" />
          </Button>
        </div>
      </div>

      {/* Desktop Submenu Bar */}
      {activeCategoryData && activeCategoryData.items.length > 0 && (
        <div className="d-none d-md-block border-bottom bg-body-tertiary px-3 px-md-4 py-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {activeCategoryData.items.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded fw-semibold text-muted small text-decoration-none"
                activeClassName="bg-primary text-white shadow-sm"
              >
                <item.icon size={14} className="flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      <OffCanvas isOpen={mobileMenuOpen} setOpen={setMobileMenuOpen} placement="end" titleId="mobile-menu-title">
        <OffCanvasHeader setOpen={setMobileMenuOpen}>
          <OffCanvasTitle id="mobile-menu-title">Menu</OffCanvasTitle>
        </OffCanvasHeader>
        <OffCanvasBody>
          {role && (
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div>
                <span className="text-muted text-uppercase d-block" style={{ fontSize: "0.625rem" }}>Logged in as</span>
                <span className="fw-semibold small">{profile?.full_name}</span>
              </div>
              <Badge color={ROLE_COLORS[role] || "secondary"} rounded="pill">{ROLE_LABELS[role] || role}</Badge>
            </div>
          )}

          <div className="d-flex flex-column gap-3">
            {filteredCategories.map((cat) => (
              <div key={cat.id}>
                <span className="text-muted fw-bold text-uppercase d-block mb-1 px-1" style={{ fontSize: "0.625rem", letterSpacing: "0.05em" }}>
                  {cat.title}
                </span>
                <div className="d-flex flex-column gap-1">
                  {cat.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded text-body fw-semibold small text-decoration-none"
                      activeClassName="bg-primary text-white"
                    >
                      <item.icon size={16} className="flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-top mt-3 pt-3 d-flex flex-column gap-2">
            <Button
              color="dark"
              isLight
              icon={darkModeStatus ? "LightMode" : "DarkMode"}
              onClick={() => setDarkModeStatus((prev) => !prev)}
            >
              {darkModeStatus ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button
              color="danger"
              isLight
              icon="Logout"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
            >
              Sign Out
            </Button>
          </div>
        </OffCanvasBody>
      </OffCanvas>
    </header>
  );
}
