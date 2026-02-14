import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function StaffDashboard() {
  const { branchId } = useAuth();
  const [stats, setStats] = useState({ todayTransactions: 0, activePawns: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    const today = new Date().toISOString().split("T")[0];
    const fetchStats = async () => {
      const [todayTx, active] = await Promise.all([
        supabase.from("pawn_transactions").select("id", { count: "exact", head: true }).eq("branch_id", branchId).gte("created_at", today),
        supabase.from("pawn_transactions").select("id", { count: "exact", head: true }).eq("branch_id", branchId).eq("status", "Active"),
      ]);
      setStats({ todayTransactions: todayTx.count || 0, activePawns: active.count || 0 });
    };
    fetchStats();
  }, [branchId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Today's overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Transactions</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.todayTransactions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Pawns</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.activePawns}</div></CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/transactions")}>
          <CardHeader><CardTitle className="text-lg">Pawn Transactions</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">View and create transactions</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/customers")}>
          <CardHeader><CardTitle className="text-lg">Customer Search</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Search customers by NIC or name</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
