import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/integrations/api";
import { useAuth } from "@/contexts/AuthContext";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { PinManagementDialog } from "@/components/users/PinManagementDialog";
import { CommonSearch, SearchField } from "@/components/CommonSearch";
import { UserPlus, ChevronLeft, ChevronRight, Lock, Filter } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  branchName: string;
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
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { role } = useAuth();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("");

  const fetchUsers = async (name?: string | null, email?: string | null, roleFilter?: string | null, branch?: string | null) => {
    try {
      // Use filter API if any filters are provided, otherwise use paginated API
      const hasFilters = name || email || roleFilter || branch;

      const response = hasFilters
        ? await apiClient.users.filter(name || undefined, email || undefined, roleFilter || undefined, branch || undefined, currentPage, pageSize, "fullName", "asc")
        : await apiClient.users.getPaginated(currentPage, pageSize, "fullName", "asc");

      const normalized: User[] = response.content.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        full_name: u.fullName as string,
        email: u.email as string,
        roles: u.role ? [u.role as string] : [],
        branchName: (u.branch as string) || "—",
      }));
      setUsers(normalized);
      setTotalPages(response.totalPages as number);
      setTotalElements(response.totalElements as number);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  const handleSearch = (filters: Record<string, string | null>) => {
    const { name, email, role: roleFilter, branch } = filters;
    setFilterName(name || "");
    setFilterEmail(email || "");
    setFilterRole(roleFilter || "all");
    setFilterBranch(branch || "");
    setCurrentPage(0);
    fetchUsers(name, email, roleFilter, branch);
  };

  const handleClearFilters = () => {
    setFilterName("");
    setFilterEmail("");
    setFilterRole("all");
    setFilterBranch("");
    setCurrentPage(0);
    fetchUsers();
  };

  const searchFields: SearchField[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name...",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter email...",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: [
        { label: "Superadmin", value: "SUPERADMIN" },
        { label: "Admin", value: "ADMIN" },
        { label: "Manager", value: "MANAGER" },
        { label: "Staff", value: "STAFF" },
      ],
    },
    {
      name: "branch",
      label: "Branch",
      type: "text",
      placeholder: "Enter branch name...",
    },
  ];

  const hasActiveFilters = filterName !== "" || filterEmail !== "" || filterRole !== "all" || filterBranch !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-slate-600 text-white">
                {[filterName, filterEmail, filterRole !== "all" ? filterRole : "", filterBranch].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {(role === "SUPERADMIN" || role === "ADMIN") && (
            <Button onClick={() => setShowCreate(true)}><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
          )}
        </div>
      </div>

      {/* Filter Panel using CommonSearch */}
      {showFilters && (
        <CommonSearch
          fields={searchFields}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          isLoading={false}
          title="User Filters"
          backgroundColor="bg-gray-100"
          borderColor="border-gray-300"
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    {(role === "SUPERADMIN" || role === "ADMIN") && u.roles.includes("MANAGER") && (
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
                        PIN
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} users
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Rows per page:</Label>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}>
              <SelectTrigger className="w-20">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages || 1}
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
