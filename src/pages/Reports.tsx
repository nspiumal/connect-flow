import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(38, 92%, 50%)", "hsl(210, 79%, 46%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)"];

export default function Reports() {
  const { role, branchId } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data: branchData } = await supabase.from("branches").select("id, name");
      if (branchData) setBranches(branchData);

      let query = supabase.from("pawn_transactions").select("*");
      if (branchId && role !== "SUPERADMIN" && role !== "ADMIN") query = query.eq("branch_id", branchId);
      if (selectedBranch !== "all") query = query.eq("branch_id", selectedBranch);
      const { data } = await query;
      if (data) setTransactions(data);
    };
    fetch();
  }, [selectedBranch, role, branchId]);

  const statusData = ["Active", "Completed", "Defaulted"].map((s) => ({
    name: s,
    count: transactions.filter((t) => t.status === s).length,
  }));

  const totalLoan = transactions.reduce((sum, t) => sum + Number(t.loan_amount), 0);
  const totalAppraised = transactions.reduce((sum, t) => sum + Number(t.appraised_value), 0);

  const monthlyData = transactions.reduce((acc: any[], t) => {
    const month = t.pawn_date?.substring(0, 7) || "Unknown";
    const existing = acc.find((a) => a.month === month);
    if (existing) { existing.amount += Number(t.loan_amount); existing.count += 1; }
    else acc.push({ month, amount: Number(t.loan_amount), count: 1 });
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        {(role === "SUPERADMIN" || role === "ADMIN") && (
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Transactions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{transactions.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loan Amount</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalLoan.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Appraised Value</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalAppraised.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Monthly Loan Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Transaction Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
