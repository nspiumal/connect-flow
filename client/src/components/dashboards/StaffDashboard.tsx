import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function StaffDashboard() {
  const { branchId } = useAuth();
  const [stats, setStats] = useState({ todayTransactions: 0, activePawns: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    setStats({ todayTransactions: 0, activePawns: 0 });
  }, [branchId]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Staff Dashboard</h1>
        <p className="text-muted-foreground mt-2">Today's overview and quick actions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Today's Transactions</CardTitle>
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats.todayTransactions}</div><p className="text-xs text-muted-foreground mt-1">This day</p></CardContent>
        </Card>
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Pawns</CardTitle>
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-foreground">{stats.activePawns}</div><p className="text-xs text-muted-foreground mt-1">In portfolio</p></CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-card" onClick={() => navigate("/transactions")}>
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
