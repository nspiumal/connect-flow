import { useEffect, useState } from "react";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { notify } from "@/components/facit/notify";
import { useAuth } from "@/hooks/useAuth";
import { TColor } from "@/vendor/facit/type/color-type";
import { t } from "@/lib/lang";

interface BranchRequest {
  id: string;
  branch_name: string;
  branch_address: string;
  branch_phone: string;
  status: "Pending" | "Approved" | "Rejected";
}

const STATUS_COLOR: Record<string, TColor> = { Approved: "success", Rejected: "danger", Pending: "warning" };

export default function BranchRequests() {
  const [requests, setRequests] = useState<BranchRequest[]>([]);
  const { role } = useAuth();

  useEffect(() => {
    setRequests([]);
    notify({ title: t("BRANCH_REQUESTS"), description: t("BACKEND_ENDPOINT_NOT_CONNECTED") });
  }, []);

  const handleAction = () => {
    notify({ title: t("NOT_AVAILABLE"), description: t("APPROVE_REJECT_NEEDS_BACKEND"), variant: "destructive" });
  };

  const columns: DataTableColumn<BranchRequest>[] = [
    { key: "branch_name", header: t("BRANCH_NAME") },
    { key: "branch_address", header: t("ADDRESS") },
    { key: "branch_phone", header: t("PHONE") },
    {
      key: "status",
      header: t("STATUS"),
      render: (r) => <Badge color={STATUS_COLOR[r.status] ?? "secondary"} isLight>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (r) =>
        r.status === "Pending" && role === "SUPERADMIN" ? (
          <>
            <Button color="success" isLight icon="Check" className="me-1" onClick={handleAction} aria-label="Approve" />
            <Button color="danger" isLight icon="Close" onClick={handleAction} aria-label="Reject" />
          </>
        ) : null,
    },
  ];

  return (
    <PageWrapper title={t("BRANCH_REQUESTS")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("BRANCH_REQUESTS"), to: "/branch-requests" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={requests} keyField={(r) => r.id} emptyMessage={t("NO_REQUESTS")} />
          </CardBody>
        </Card>
      </Page>
    </PageWrapper>
  );
}
