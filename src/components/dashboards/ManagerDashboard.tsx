import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function ManagerDashboard() {
  const { branchId } = useAuth();
  const [stats, setStats] = useState({ activePawns: 0, staffCount: 0, recentTransactions: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    const fetchStats = async () => {
      const [pawns, staff, recent] = await Promise.all([
        supabase.from("pawn_transactions").select("id", { count: "exact", head: true }).eq("branch_id", branchId).eq("status", "Active"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("branch_id", branchId).eq("role", "STAFF"),
        supabase.from("pawn_transactions").select("id", { count: "exact", head: true }).eq("branch_id", branchId).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);
      setStats({ activePawns: pawns.count || 0, staffCount: staff.count || 0, recentTransactions: recent.count || 0 });
    };
    fetchStats();
  }, [branchId]);

  const widgets = [
    { title: "Active Pawns", value: stats.activePawns, icon: FileText, color: "text-amber-600" },
    { title: "Branch Staff", value: stats.staffCount, icon: Users, color: "text-blue-600" },
    { title: "This Week", value: stats.recentTransactions, icon: Clock, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Your branch overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgets.map((w) => (
          <Card key={w.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.title}</CardTitle>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{w.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/transactions")}>
          <CardHeader><CardTitle className="text-lg">New Transaction</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Create a new pawn transaction</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/customers")}>
          <CardHeader><CardTitle className="text-lg">Customer Search</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Search customers by NIC or name</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
