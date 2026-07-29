import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/integrations/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { PinManagementDialog } from "@/components/users/PinManagementDialog";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";
import { UserPlus, ChevronLeft, ChevronRight, Lock, Filter, Edit } from "lucide-react";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { t } from "@/lib/lang";

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  branchName: string;
  branchId?: string;
}

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "destructive",
  ADMIN: "default",
  MANAGER: "secondary",
  STAFF: "outline",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { role } = useAuth();
  const has = usePermission();

  // Filter state
  const [showFilters, setShowFilters] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState("");

  const fetchUsers = useCallback(async (name?: string | null, email?: string | null, roleFilter?: string | string[] | null, branch?: string | null) => {
    try {
      // Use filter API if any filters are provided, otherwise use paginated API
      const hasFilters = name || email || roleFilter || branch;

      const response = hasFilters
        ? await apiClient.users.filter(name || undefined, email || undefined, roleFilter || undefined, branch || undefined, currentPage, pageSize, "fullName", "asc")
        : await apiClient.users.getPaginated(currentPage, pageSize, "fullName", "asc");

      const normalized: User[] = response.content.map((u: any) => {
        const primaryRole = u.roles && u.roles.length > 0 ? u.roles[0] : null;
        return {
          id: u.id,
          full_name: u.fullName,
          email: u.email,
          roles: primaryRole ? [primaryRole.role] : [],
          branchName: primaryRole && primaryRole.branch ? primaryRole.branch.name : "—",
          branchId: primaryRole ? primaryRole.branchId : undefined,
        };
      });
      setUsers(normalized);
      setTotalPages(response.totalPages as number);
      setTotalElements(response.totalElements as number);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchUsers(
      filterName || undefined,
      filterEmail || undefined,
      filterRole.length > 0 ? filterRole : undefined,
      filterBranch || undefined
    );
  }, [currentPage, pageSize, filterName, filterEmail, filterRole, filterBranch, fetchUsers]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const name = typeof filters.name === "string" ? filters.name : "";
    const email = typeof filters.email === "string" ? filters.email : "";
    const branch = typeof filters.branch === "string" ? filters.branch : "";
    const roleFilter = Array.isArray(filters.role)
      ? filters.role.filter((value): value is string => typeof value === "string")
      : [];

    setFilterName(name);
    setFilterEmail(email);
    setFilterRole(roleFilter);
    setFilterBranch(branch);
    setCurrentPage(0);
  };

  const hasActiveFilters = filterName !== "" || filterEmail !== "" || filterRole.length > 0 || filterBranch !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t("USER_MANAGEMENT")}</h1>
        <div className="flex gap-2">
          {has("users.create") && (
            <Button onClick={() => setShowCreate(true)}><UserPlus className="mr-2 h-4 w-4" /> {t("CREATE_USER")}</Button>
          )}
        </div>
      </div>

      {/* Filter Panel using AdvancedSearchPanel */}
      {showFilters && (
        <AdvancedSearchPanel
          title={t("USER_FILTERS")}
          subtitle={t("SEARCH_USERS_BY_NAME_EMAIL_ROLE_BRANCH")}
          inputFields={[
            {
              name: "name",
              label: t("NAME"),
              placeholder: t("ENTER_USER_NAME"),
              inline: true,
            },
            {
              name: "email",
              label: t("EMAIL"),
              placeholder: t("ENTER_EMAIL"),
              inline: true,
            },
            {
              name: "branch",
              label: t("BRANCH"),
              placeholder: t("ENTER_BRANCH_NAME"),
              inline: true,
            },
          ]}
          checkboxGroups={[
            {
              name: "role",
              label: "Role",
              options: [
                { label: t("SUPERADMIN_LABEL"), value: "SUPERADMIN" },
                { label: t("ADMIN_LABEL"), value: "ADMIN" },
                { label: t("MANAGER_LABEL"), value: "MANAGER" },
                { label: t("STAFF_LABEL"), value: "STAFF" },
              ],
              inline: true,
            },
          ]}
          onSearch={handleSearch}
          isLoading={false}
          backgroundColor="bg-gray-100"
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("NAME")}</TableHead>
                <TableHead>{t("EMAIL")}</TableHead>
                <TableHead>{t("ROLE")}</TableHead>
                <TableHead>{t("BRANCH")}</TableHead>
                <TableHead className="text-right">{t("ACTIONS")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.roles.map((r: string) => (
                      <Badge
                        key={r}
                        variant={ROLE_COLORS[r] as "default" | "secondary" | "destructive" | "outline"}
                        className="mr-1"
                      >
                        {r}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{u.branchName}</TableCell>
                  <TableCell className="text-right">
                    {has("users.edit") && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForEdit(u);
                            setShowEditDialog(true);
                          }}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          {t("EDIT")}
                        </Button>
                        {has("users.pin.set") && u.roles.includes("MANAGER") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForPin(u);
                              setShowPinDialog(true);
                            }}
                            className="gap-2"
                          >
                            <Lock className="h-4 w-4" />
                            {t("PIN")}
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("NO_USERS_FOUND")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} users
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">{t("ROWS_PER_PAGE")}</Label>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}>
              <SelectTrigger className="w-16 sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm">
              {t("PAGE")} {currentPage + 1} {t("OF")} {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CreateUserDialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) fetchUsers(); }} />

      <EditUserDialog
        user={selectedUserForEdit}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchUsers}
      />

      {selectedUserForPin && (
        <PinManagementDialog
          userId={selectedUserForPin.id}
          userName={selectedUserForPin.full_name}
          open={showPinDialog}
          onOpenChange={setShowPinDialog}
          onSuccess={() => fetchUsers()}
        />
      )}
    </div>
  );
}
