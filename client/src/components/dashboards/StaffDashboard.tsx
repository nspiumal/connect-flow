import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import { StatCard } from "@/components/facit/StatCard";
import { useAuth } from "@/hooks/useAuth";

export function StaffDashboard() {
  const { branchId } = useAuth();
  const [stats, setStats] = useState({ todayTransactions: 0, activePawns: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    setStats({ todayTransactions: 0, activePawns: 0 });
  }, [branchId]);

  return (
    <PageWrapper title="Staff Dashboard">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Dashboard", to: "/dashboard" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <h1 className="fw-bold">Staff Dashboard</h1>
          <p className="text-muted">Today's overview and quick actions</p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <StatCard title="Today's Transactions" value={stats.todayTransactions} icon="History" iconColor="warning" description="This day" />
          </div>
          <div className="col-12 col-md-6">
            <StatCard title="Active Pawns" value={stats.activePawns} icon="Description" iconColor="info" description="In portfolio" />
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/transactions")}>
              <CardHeader>
                <CardTitle>Pawn Transactions</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">View and create transactions</p>
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
