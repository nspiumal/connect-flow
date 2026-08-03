import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import { StatCard } from "@/components/facit/StatCard";
import { useAuth } from "@/hooks/useAuth";

export function ManagerDashboard() {
  const { branchId } = useAuth();
  const [stats, setStats] = useState({ activePawns: 0, staffCount: 0, recentTransactions: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    setStats({ activePawns: 0, staffCount: 0, recentTransactions: 0 });
  }, [branchId]);

  const widgets = [
    { title: "Active Pawns", value: stats.activePawns, icon: "Description", color: "warning" },
    { title: "Branch Staff", value: stats.staffCount, icon: "Group", color: "primary" },
    { title: "This Week", value: stats.recentTransactions, icon: "History", color: "success" },
  ] as const;

  return (
    <PageWrapper title="Manager Dashboard">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Dashboard", to: "/dashboard" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <h1 className="fw-bold">Manager Dashboard</h1>
          <p className="text-muted">Branch overview and performance metrics</p>
        </div>

        <div className="row g-4 mb-4">
          {widgets.map((w) => (
            <div key={w.title} className="col-12 col-md-4">
              <StatCard title={w.title} value={w.value} icon={w.icon} iconColor={w.color} description="Total count" />
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/transactions")}>
              <CardHeader>
                <CardTitle>New Transaction</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Create a new pawn transaction</p>
              </CardBody>
            </Card>
          </div>
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/customers")}>
              <CardHeader>
                <CardTitle>Customer Search</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Search customers by NIC or name</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
}
