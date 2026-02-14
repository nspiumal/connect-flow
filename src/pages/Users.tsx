import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "destructive",
  ADMIN: "default",
  MANAGER: "secondary",
  STAFF: "outline",
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const { role } = useAuth();

  const fetchUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role, branch_id");
    if (!roles) return;
    const userIds = [...new Set(roles.map((r) => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");
    if (!profiles) return;
    const { data: branches } = await supabase.from("branches").select("id, name");

    const merged = profiles.map((p) => {
      const userRoles = roles.filter((r) => r.user_id === p.id);
      const branch = userRoles[0]?.branch_id ? branches?.find((b) => b.id === userRoles[0].branch_id) : null;
      return { ...p, roles: userRoles.map((r) => r.role), branchName: branch?.name || "—" };
    });
    setUsers(merged);
  };

  useEffect(() => { fetchUsers(); }, []);

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
      <CreateUserDialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) fetchUsers(); }} />
    </div>
  );
}
