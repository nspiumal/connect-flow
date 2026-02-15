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
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "destructive",
  ADMIN: "default",
  MANAGER: "secondary",
  STAFF: "outline",
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const { role } = useAuth();

  const fetchUsers = async () => {
    try {
      const response = await apiClient.users.getPaginated(currentPage, pageSize, sortBy, sortDir);
      const normalized = response.content.map((u: any) => ({
        id: u.id,
        full_name: u.fullName,
        email: u.email,
        roles: u.role ? [u.role] : [],
        branchName: u.branch || "—",
      }));
      setUsers(normalized);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => { fetchUsers(); }, [currentPage, pageSize, sortBy, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        {(role === "SUPERADMIN" || role === "ADMIN") && (
          <Button onClick={() => setShowCreate(true)}><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.roles.map((r: string) => (
                      <Badge key={r} variant={ROLE_COLORS[r] as any} className="mr-1">{r}</Badge>
                    ))}
                  </TableCell>
                  <TableCell>{u.branchName}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
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
    </div>
  );
}
