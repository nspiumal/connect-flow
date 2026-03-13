import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import apiClient from "@/integrations/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// ─── local types ───────────────────────────────────────────────────────────

interface TxItem { appraisedValue?: number }
interface Transaction {
  id?: string;
  pawnDate?: string;
  loanAmount?: number;
  itemDetails?: TxItem[];
}
interface ProfitItem {
  profitRecordedDate?: string;
  profitAmount?: number;
}
interface Branch { id: string; name: string }
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────

const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

/** All calendar days of a YYYY-MM string as "YYYY-MM-DD" */
const daysOfMonth = (ym: string): string[] => {
  const [y, m] = ym.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) =>
    `${ym}-${String(i + 1).padStart(2, "0")}`
  );
};

const formatCurrency = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatShort = (v: number) => {
  if (v >= 1_000_000) return `Rs.${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rs.${(v / 1_000).toFixed(0)}K`;
  return `Rs.${v}`;
};

// ─── custom tooltips ───────────────────────────────────────────────────────

const LoanTooltip = ({ active, payload, label, view }: TooltipProps & { view: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded p-2 shadow text-xs space-y-0.5">
      <p className="font-semibold">{view === "daily" ? `Day ${label}` : `Month ${label}`}</p>
      <p className="text-orange-600">{formatCurrency(Number(payload[0].value))}</p>
      {payload[1] && <p className="text-muted-foreground">{payload[1].value} transactions</p>}
    </div>
  );
};

const ProfitTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded p-2 shadow text-xs space-y-0.5">
      <p className="font-semibold">Day {label}</p>
      <p className="text-green-600">{formatCurrency(Number(payload[0].value))}</p>
    </div>
  );
};

// ─── component ─────────────────────────────────────────────────────────────

export default function Reports() {
  const { role, branchId: myBranchId } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedView, setSelectedView] = useState<"daily" | "monthly">("daily");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profitedItems, setProfitedItems] = useState<ProfitItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  // ── derived date range ──────────────────────────────────────────────────
  const [selYear, selMonth] = selectedMonth.split("-").map(Number);

  const { fetchStart, fetchEnd } = useMemo(() => {
    if (selectedView === "daily") {
      const lastDay = new Date(selYear, selMonth, 0).getDate();
      return {
        fetchStart: `${selectedMonth}-01`,
        fetchEnd: `${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    // monthly view → full selected year
    return {
      fetchStart: `${selYear}-01-01`,
      fetchEnd: `${selYear}-12-31`,
    };
  }, [selectedView, selectedMonth, selYear, selMonth]);

  const effectiveBranchId = useMemo(() => {
    if (role === "SUPERADMIN" || role === "ADMIN") {
      return selectedBranch !== "all" ? selectedBranch : undefined;
    }
    return myBranchId ?? undefined;
  }, [role, selectedBranch, myBranchId]);

  // ── load branches once ──────────────────────────────────────────────────
  useEffect(() => {
    apiClient.branches.getActive()
      .then((data: Branch[]) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── load transactions + profits ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, profitRes] = await Promise.all([
        apiClient.pawnTransactions.searchAdvanced({
          startDate: fetchStart,
          endDate: fetchEnd,
          filterBranchId: effectiveBranchId,
          page: 0,
          size: 1000,
          sortBy: "pawnDate",
          sortDir: "asc",
        }),
        apiClient.profitedTransactions.getPaginated(0, 1000),
      ]);
      setTransactions(txRes.content ?? []);
      setProfitedItems(profitRes.content ?? []);
    } catch (e) {
      console.error("Reports load error", e);
    } finally {
      setLoading(false);
    }
  }, [fetchStart, fetchEnd, effectiveBranchId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── KPI — always scoped to selectedMonth ──────────────────────────────
  const kpiTx = useMemo(() =>
    selectedView === "daily"
      ? transactions
      : transactions.filter(t => String(t.pawnDate ?? "").startsWith(selectedMonth)),
    [transactions, selectedView, selectedMonth]
  );

  const totalTx       = kpiTx.length;
  const totalLoan     = kpiTx.reduce((s, t) => s + Number(t.loanAmount ?? 0), 0);
  const totalAppraised = kpiTx.reduce((s, t) =>
    s + (t.itemDetails ?? []).reduce((si: number, item: TxItem) => si + Number(item.appraisedValue ?? 0), 0), 0
  );

  // ── profit for selectedMonth ───────────────────────────────────────────
  const monthProfits = useMemo(() =>
    profitedItems.filter(p =>
      String(p.profitRecordedDate ?? "").startsWith(selectedMonth)
    ),
    [profitedItems, selectedMonth]
  );
  const totalProfit = monthProfits.reduce((s, p) => s + Number(p.profitAmount ?? 0), 0);

  // ── loan volume chart ─────────────────────────────────────────────────
  const loanChartData = useMemo(() => {
    if (selectedView === "daily") {
      const map: Record<string, number> = {};
      transactions.forEach(t => {
        const d = String(t.pawnDate ?? "").slice(0, 10);
        map[d] = (map[d] ?? 0) + Number(t.loanAmount ?? 0);
      });
      return daysOfMonth(selectedMonth).map(d => ({
        label: String(parseInt(d.slice(8))),   // "01" → "1"
        amount: map[d] ?? 0,
      }));
    }
    // monthly → 12 bars for the year
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      const m = String(t.pawnDate ?? "").slice(0, 7);
      if (m) map[m] = (map[m] ?? 0) + Number(t.loanAmount ?? 0);
    });
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${selYear}-${String(i + 1).padStart(2, "0")}`;
      return { label: String(i + 1), amount: map[key] ?? 0 };
    });
  }, [transactions, selectedView, selectedMonth, selYear]);

  // ── profit daily chart (always current month) ─────────────────────────
  const profitChartData = useMemo(() => {
    const map: Record<string, number> = {};
    monthProfits.forEach(p => {
      const d = String(p.profitRecordedDate ?? "").slice(0, 10);
      map[d] = (map[d] ?? 0) + Number(p.profitAmount ?? 0);
    });
    return daysOfMonth(selectedMonth).map(d => ({
      label: String(parseInt(d.slice(8))),
      profit: map[d] ?? 0,
    }));
  }, [monthProfits, selectedMonth]);

  const label = monthLabel(selectedMonth);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} />

      {/* Header + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
          {(role === "SUPERADMIN" || role === "ADMIN") && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: Branch) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Total Transactions",    value: totalTx.toLocaleString() },
          { title: "Total Loan Amount",     value: formatCurrency(totalLoan) },
          { title: "Total Appraised Value", value: formatCurrency(totalAppraised) },
        ].map(({ title, value }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : value}</div>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Loan Volume */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedView === "daily" ? "Daily" : "Monthly"} Loan Volume
              </CardTitle>
              <div className="flex gap-1">
                {(["daily", "monthly"] as const).map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={selectedView === v ? "default" : "outline"}
                    className="capitalize h-7 text-xs px-3"
                    onClick={() => setSelectedView(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedView === "daily" ? label : String(selYear)}
              {loading ? " · loading…" : ` · ${transactions.length} records`}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={loanChartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} width={80} />
                <Tooltip content={<LoanTooltip view={selectedView} />} />
                <Bar dataKey="amount" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profit Overview</CardTitle>
              <div className="text-right">
                <p className="text-base font-bold text-green-600">
                  {loading ? "—" : formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthProfits.length} profited · {label}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={profitChartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} width={80} />
                <Tooltip content={<ProfitTooltip />} />
                <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
