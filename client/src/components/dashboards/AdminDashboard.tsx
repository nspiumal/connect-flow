import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import { StatCard } from "@/components/facit/StatCard";
import apiClient from "@/integrations/api";

export function AdminDashboard() {
  const [stats, setStats] = useState({ managers: 0, totalStaff: 0, activePawns: 0, activeRates: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.users.getDashboardStatsAdmin();
        setStats({
          managers: data.managers || 0,
          totalStaff: data.totalStaff || 0,
          activePawns: data.activePawns || 0,
          activeRates: data.activeRates || 0,
        });
      } catch (error) {
        setStats({ managers: 0, totalStaff: 0, activePawns: 0, activeRates: 0 });
      }
    };
    fetchStats();
  }, []);

  const widgets = [
    { title: "Branch Managers", value: stats.managers, icon: "Group", color: "primary" },
    { title: "Total Staff", value: stats.totalStaff, icon: "SupervisorAccount", color: "success" },
    { title: "Active Pawns", value: stats.activePawns, icon: "Description", color: "warning" },
    { title: "Interest Rates", value: stats.activeRates, icon: "Percent", color: "info" },
  ] as const;

  return (
    <PageWrapper title="Admin Dashboard">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Dashboard", to: "/dashboard" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <h1 className="fw-bold">Admin Dashboard</h1>
          <p className="text-muted">Manage staff, rates, and branch operations</p>
        </div>

        <div className="row g-4 mb-4">
          {widgets.map((w) => (
            <div key={w.title} className="col-12 col-md-6 col-lg-3">
              <StatCard title={w.title} value={w.value} icon={w.icon} iconColor={w.color} description="Total count" />
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/users")}>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Manage staff and branch managers</p>
              </CardBody>
            </Card>
          </div>
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/interest-rates")}>
              <CardHeader>
                <CardTitle>Interest Rates</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Configure interest rates by period</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
}
