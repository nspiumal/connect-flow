import { useCallback, useEffect, useState } from "react";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import apiClient from "@/integrations/api";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { PinManagementDialog } from "@/components/users/PinManagementDialog";
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

const ROLE_COLORS: Record<string, "danger" | "primary" | "secondary" | "success"> = {
  SUPERADMIN: "danger",
  ADMIN: "primary",
  MANAGER: "secondary",
  STAFF: "success",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const has = usePermission();

  // Filter state
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState("");

  const fetchUsers = useCallback(async (name?: string | null, email?: string | null, roleFilter?: string | string[] | null, branch?: string | null) => {
    setIsLoading(true);
    try {
      const hasFilters = name || email || roleFilter || branch;

      const response = hasFilters
        ? await apiClient.users.filter(name || undefined, email || undefined, roleFilter || undefined, branch || undefined, currentPage, pageSize, "fullName", "asc")
        : await apiClient.users.getPaginated(currentPage, pageSize, "fullName", "asc");

      interface RawUser {
        id: string;
        fullName: string;
        email: string;
        roles?: { role: string; branchId?: string; branch?: { name: string } }[];
      }
      const normalized: User[] = response.content.map((u: RawUser) => {
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
    } finally {
      setIsLoading(false);
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

  const columns: DataTableColumn<User>[] = [
    { key: "full_name", header: t("NAME") },
    { key: "email", header: t("EMAIL") },
    {
      key: "roles",
      header: t("ROLE"),
      render: (u) => (
        <>
          {u.roles.map((r) => (
            <Badge key={r} color={ROLE_COLORS[r] ?? "secondary"} className="me-1">
              {r}
            </Badge>
          ))}
        </>
      ),
    },
    { key: "branchName", header: t("BRANCH") },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (u) => (
        <>
          {has("users.edit") && (
            <Button
              color="dark"
              isLight
              icon="Edit"
              className="me-1"
              onClick={() => {
                setSelectedUserForEdit(u);
                setShowEditDialog(true);
              }}
            >
              {t("EDIT")}
            </Button>
          )}
          {has("users.pin.set") && u.roles.includes("MANAGER") && (
            <Button
              color="dark"
              isLight
              icon="Lock"
              onClick={() => {
                setSelectedUserForPin(u);
                setShowPinDialog(true);
              }}
            >
              {t("PIN")}
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <PageWrapper title={t("USER_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("USER_MANAGEMENT"), to: "/users" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          {has("users.create") && (
            <Button color="primary" icon="PersonAdd" onClick={() => setShowCreate(true)}>
              {t("CREATE_USER")}
            </Button>
          )}
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title={t("USER_FILTERS")}
            subtitle={t("SEARCH_USERS_BY_NAME_EMAIL_ROLE_BRANCH")}
            inputFields={[
              { name: "name", label: t("NAME"), placeholder: t("ENTER_USER_NAME"), inline: true },
              { name: "email", label: t("EMAIL"), placeholder: t("ENTER_EMAIL"), inline: true },
              { name: "branch", label: t("BRANCH"), placeholder: t("ENTER_BRANCH_NAME"), inline: true },
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
            isLoading={isLoading}
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={users} keyField={(u) => u.id} isLoading={isLoading} emptyMessage={t("NO_USERS_FOUND")} />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="users"
          />
        </Card>
      </Page>

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
    </PageWrapper>
  );
}
