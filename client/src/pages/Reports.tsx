import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { ApexOptions } from "apexcharts";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import Chart from "@/vendor/facit/components/extras/Chart";
import apiClient from "@/integrations/api";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { useBranchOptions } from "@/hooks/useLookups";
import { t } from "@/lib/lang";

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
  return Array.from({ length: count }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
};

const formatCurrency = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatShort = (v: number) => {
  if (v >= 1_000_000) return `Rs.${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rs.${(v / 1_000).toFixed(0)}K`;
  return `Rs.${v}`;
};

// ─── component ─────────────────────────────────────────────────────────────

export default function Reports() {
  const { branchId: myBranchId } = useAuth();
  const has = usePermission();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedView, setSelectedView] = useState<"daily" | "monthly">("daily");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profitedItems, setProfitedItems] = useState<ProfitItem[]>([]);
  const branches = useBranchOptions();
  const [loading, setLoading] = useState(false);

  const [selYear, selMonth] = selectedMonth.split("-").map(Number);

  const { fetchStart, fetchEnd } = useMemo(() => {
    if (selectedView === "daily") {
      const lastDay = new Date(selYear, selMonth, 0).getDate();
      return { fetchStart: `${selectedMonth}-01`, fetchEnd: `${selectedMonth}-${String(lastDay).padStart(2, "0")}` };
    }
    return { fetchStart: `${selYear}-01-01`, fetchEnd: `${selYear}-12-31` };
  }, [selectedView, selectedMonth, selYear, selMonth]);

  const effectiveBranchId = useMemo(() => {
    if (has("reports.filter.branch")) {
      return selectedBranch !== "all" ? selectedBranch : undefined;
    }
    return myBranchId ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, myBranchId]);

  // Guards against out-of-order responses: rapid date-range/branch clicking can
  // fire several overlapping requests, and without this a slower, superseded
  // response could land after (and overwrite) the latest one.
  const latestRequestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
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
      if (latestRequestIdRef.current !== requestId) return; // a newer request has superseded this one
      setTransactions(txRes.content ?? []);
      setProfitedItems(profitRes.content ?? []);
    } catch (e) {
      if (latestRequestIdRef.current !== requestId) return;
      console.error("Reports load error", e);
    } finally {
      if (latestRequestIdRef.current === requestId) setLoading(false);
    }
  }, [fetchStart, fetchEnd, effectiveBranchId]);

  useEffect(() => { loadData(); }, [loadData]);

  const kpiTx = useMemo(
    () => (selectedView === "daily" ? transactions : transactions.filter((tx) => String(tx.pawnDate ?? "").startsWith(selectedMonth))),
    [transactions, selectedView, selectedMonth]
  );

  const totalTx = kpiTx.length;
  const totalLoan = kpiTx.reduce((s, tx) => s + Number(tx.loanAmount ?? 0), 0);
  const totalAppraised = kpiTx.reduce(
    (s, tx) => s + (tx.itemDetails ?? []).reduce((si: number, item: TxItem) => si + Number(item.appraisedValue ?? 0), 0),
    0
  );

  const monthProfits = useMemo(
    () => profitedItems.filter((p) => String(p.profitRecordedDate ?? "").startsWith(selectedMonth)),
    [profitedItems, selectedMonth]
  );
  const totalProfit = monthProfits.reduce((s, p) => s + Number(p.profitAmount ?? 0), 0);

  const loanChart = useMemo(() => {
    let labels: string[];
    let amounts: number[];
    if (selectedView === "daily") {
      const map: Record<string, number> = {};
      transactions.forEach((tx) => {
        const d = String(tx.pawnDate ?? "").slice(0, 10);
        map[d] = (map[d] ?? 0) + Number(tx.loanAmount ?? 0);
      });
      const days = daysOfMonth(selectedMonth);
      labels = days.map((d) => String(parseInt(d.slice(8), 10)));
      amounts = days.map((d) => map[d] ?? 0);
    } else {
      const map: Record<string, number> = {};
      transactions.forEach((tx) => {
        const m = String(tx.pawnDate ?? "").slice(0, 7);
        if (m) map[m] = (map[m] ?? 0) + Number(tx.loanAmount ?? 0);
      });
      labels = Array.from({ length: 12 }, (_, i) => String(i + 1));
      amounts = Array.from({ length: 12 }, (_, i) => map[`${selYear}-${String(i + 1).padStart(2, "0")}`] ?? 0);
    }
    return { labels, amounts };
  }, [transactions, selectedView, selectedMonth, selYear]);

  const profitChart = useMemo(() => {
    const map: Record<string, number> = {};
    monthProfits.forEach((p) => {
      const d = String(p.profitRecordedDate ?? "").slice(0, 10);
      map[d] = (map[d] ?? 0) + Number(p.profitAmount ?? 0);
    });
    const days = daysOfMonth(selectedMonth);
    return { labels: days.map((d) => String(parseInt(d.slice(8), 10))), amounts: days.map((d) => map[d] ?? 0) };
  }, [monthProfits, selectedMonth]);

  const label = monthLabel(selectedMonth);

  const barOptions = (labels: string[], color: string, unitLabel: string): ApexOptions => ({
    chart: { toolbar: { show: false } },
    xaxis: { categories: labels, labels: { style: { fontSize: "11px" } } },
    yaxis: { labels: { formatter: (v: number) => formatShort(v), style: { fontSize: "10px" } } },
    colors: [color],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${formatCurrency(v)}${unitLabel ? ` (${unitLabel})` : ""}` } },
    grid: { strokeDashArray: 3 },
  });

  return (
    <PageWrapper title={t("REPORTS")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("REPORTS"), to: "/reports" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: 160 }}
          />
          {has("reports.filter.branch") && (
            <Select ariaLabel="Branch" value={selectedBranch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBranch(e.target.value)} size="sm" className="ms-2" style={{ width: 200 }}>
              <Option value="all">{t("ALL_BRANCHES")}</Option>
              {branches.map((b) => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          )}
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="row g-4 mb-4">
          {[
            { title: t("TOTAL_TRANSACTIONS"), value: totalTx.toLocaleString() },
            { title: t("TOTAL_LOAN_AMOUNT"), value: formatCurrency(totalLoan) },
            { title: t("TOTAL_APPRAISED_VALUE"), value: formatCurrency(totalAppraised) },
          ].map(({ title, value }) => (
            <div key={title} className="col-12 col-md-4">
              <Card>
                <CardBody>
                  <div className="text-muted text-uppercase small fw-bold">{title}</div>
                  <div className="fs-3 fw-bold">{loading ? "—" : value}</div>
                  <p className="text-muted small mb-0">{label}</p>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between w-100">
                  <CardTitle>{selectedView === "daily" ? t("DAILY") : t("MONTHLY")} {t("LOAN_VOLUME")}</CardTitle>
                  <div className="d-flex gap-1">
                    {(["daily", "monthly"] as const).map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        color={selectedView === v ? "primary" : "dark"}
                        isLight={selectedView !== v}
                        className="text-capitalize"
                        onClick={() => setSelectedView(v)}
                      >
                        {v === "daily" ? t("DAILY") : t("MONTHLY")}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-muted small mb-2">
                  {selectedView === "daily" ? label : String(selYear)}
                  {loading ? " · loading…" : ` · ${transactions.length} records`}
                </p>
                <Chart
                  type="bar"
                  height={280}
                  series={[{ name: "Loan Amount", data: loanChart.amounts }]}
                  options={barOptions(loanChart.labels, "#ffcf52", "")}
                />
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-6">
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between w-100">
                  <CardTitle>{t("PROFIT_OVERVIEW")}</CardTitle>
                  <div className="text-end">
                    <p className="fw-bold text-success mb-0">{loading ? "—" : formatCurrency(totalProfit)}</p>
                    <p className="text-muted small mb-0">{monthProfits.length} forfeited · {label}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Chart
                  type="bar"
                  height={280}
                  series={[{ name: "Profit", data: profitChart.amounts }]}
                  options={barOptions(profitChart.labels, "#46bcaa", "")}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
}
