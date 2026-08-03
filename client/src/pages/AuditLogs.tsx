import { useEffect, useState } from "react";
import { format } from "date-fns";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { t } from "@/lib/lang";

interface AuditLogEntry {
  id: string;
  created_at: string;
  action: string;
  target_table?: string;
  target_id?: string;
  details?: unknown;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setLogs([]);
  }, []);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    { key: "created_at", header: t("TIMESTAMP"), className: "small", render: (l) => format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss") },
    { key: "action", header: t("ACTION") },
    { key: "target", header: t("TARGET"), render: (l) => `${l.target_table ?? ""} ${l.target_id ? `#${l.target_id}` : ""}`.trim() },
    { key: "details", header: t("DETAILS"), className: "small text-truncate", render: (l) => (l.details ? JSON.stringify(l.details) : "—") },
  ];

  return (
    <PageWrapper title={t("AUDIT_LOGS")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("AUDIT_LOGS"), to: "/audit-logs" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={logs} keyField={(l) => l.id} emptyMessage={t("NO_AUDIT_LOGS")} />
          </CardBody>
        </Card>
      </Page>
    </PageWrapper>
  );
}
