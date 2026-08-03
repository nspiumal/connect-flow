import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { StatCard } from "@/components/facit/StatCard";
import apiClient from "@/integrations/api";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";

export function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalBranches: 0, pendingRequests: 0, totalUsers: 0, activeBranches: 0 });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [branches, users] = await Promise.all([
          apiClient.branches.getAll(),
          apiClient.users.getAll(),
        ]);
        const activeBranches = branches.filter((b: { isActive?: boolean; is_active?: boolean }) => (b.isActive ?? b.is_active) === true).length;
        setStats({
          totalBranches: branches.length || 0,
          pendingRequests: 0,
          totalUsers: users.length || 0,
          activeBranches,
        });
      } catch (error) {
        setStats({ totalBranches: 0, pendingRequests: 0, totalUsers: 0, activeBranches: 0 });
      }
    };
    fetchStats();
  }, []);

  const widgets = [
    { title: "Total Branches", value: stats.totalBranches, icon: "AccountBalance", color: "primary" },
    { title: "Pending Requests", value: stats.pendingRequests, icon: "PendingActions", color: "warning" },
    { title: "Total Users", value: stats.totalUsers, icon: "Group", color: "success" },
    { title: "Active Branches", value: stats.activeBranches, icon: "CheckCircle", color: "info" },
  ] as const;

  return (
    <PageWrapper title="Super Admin Dashboard">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Dashboard", to: "/dashboard" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="primary" icon="PersonAdd" onClick={() => setShowCreateUser(true)}>
            Create User
          </Button>
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <h1 className="fw-bold">Super Admin Dashboard</h1>
          <p className="text-muted">System overview, management, and analytics</p>
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
            <Card className="cursor-pointer h-100" onClick={() => navigate("/branches")}>
              <CardHeader>
                <CardTitle>Branch Management</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Manage all branches, assign managers</p>
              </CardBody>
            </Card>
          </div>
          <div className="col-12 col-md-6">
            <Card className="cursor-pointer h-100" onClick={() => navigate("/branch-requests")}>
              <CardHeader>
                <CardTitle>Branch Requests</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted mb-0">Review pending branch requests</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>

      <CreateUserDialog open={showCreateUser} onOpenChange={setShowCreateUser} />
    </PageWrapper>
  );
}
