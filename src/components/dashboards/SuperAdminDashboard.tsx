import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, ClipboardList, CheckCircle, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";

export function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalBranches: 0, pendingRequests: 0, totalUsers: 0, activeBranches: 0 });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const [branches, requests, users, active] = await Promise.all([
        supabase.from("branches").select("id", { count: "exact", head: true }),
        supabase.from("branch_requests").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("branches").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      setStats({
        totalBranches: branches.count || 0,
        pendingRequests: requests.count || 0,
        totalUsers: users.count || 0,
        activeBranches: active.count || 0,
      });
    };
    fetchStats();
  }, []);

  const widgets = [
    { title: "Total Branches", value: stats.totalBranches, icon: Building2, color: "text-blue-600" },
    { title: "Pending Requests", value: stats.pendingRequests, icon: ClipboardList, color: "text-orange-600" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-green-600" },
    { title: "Active Branches", value: stats.activeBranches, icon: CheckCircle, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button onClick={() => setShowCreateUser(true)} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
          <UserPlus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <Card key={w.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.title}</CardTitle>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{w.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/branches")}>
          <CardHeader><CardTitle className="text-lg">Branch Management</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Manage all branches, assign managers</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/branch-requests")}>
          <CardHeader><CardTitle className="text-lg">Branch Requests</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Review pending branch requests</p></CardContent>
        </Card>
      </div>

      <CreateUserDialog open={showCreateUser} onOpenChange={setShowCreateUser} />
    </div>
  );
}
