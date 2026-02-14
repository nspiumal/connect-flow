import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, FileText, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const [stats, setStats] = useState({ managers: 0, totalStaff: 0, activePawns: 0, activeRates: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const [managers, staff, pawns, rates] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "MANAGER"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "STAFF"),
        supabase.from("pawn_transactions").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("interest_rates").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      setStats({
        managers: managers.count || 0,
        totalStaff: staff.count || 0,
        activePawns: pawns.count || 0,
        activeRates: rates.count || 0,
      });
    };
    fetchStats();
  }, []);

  const widgets = [
    { title: "Branch Managers", value: stats.managers, icon: Users, color: "text-blue-600" },
    { title: "Total Staff", value: stats.totalStaff, icon: UserCheck, color: "text-green-600" },
    { title: "Active Pawns", value: stats.activePawns, icon: FileText, color: "text-amber-600" },
    { title: "Interest Rates", value: stats.activeRates, icon: Percent, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage staff, rates, and operations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <Card key={w.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.title}</CardTitle>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{w.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/users")}>
          <CardHeader><CardTitle className="text-lg">Staff Management</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Manage staff and branch managers</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/interest-rates")}>
          <CardHeader><CardTitle className="text-lg">Interest Rates</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Configure interest rates by period</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
