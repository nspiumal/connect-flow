import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import apiClient from "@/integrations/api";
import { t } from "@/lib/lang";

interface ActivityLogEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  description: string;
  httpMethod: string;
  endpoint: string;
  ipAddress: string;
  status: "SUCCESS" | "FAILURE";
  errorMessage: string | null;
  createdAt: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterUserName, setFilterUserName] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = useCallback(async (userName?: string, action?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.activityLogs.search(userName || undefined, action || undefined, currentPage, pageSize);
      setLogs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchLogs(filterUserName || undefined, filterAction || undefined);
  }, [currentPage, pageSize, filterUserName, filterAction, fetchLogs]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    setFilterUserName(typeof filters.userName === "string" ? filters.userName : "");
    setFilterAction(typeof filters.action === "string" ? filters.action : "");
    setCurrentPage(0);
  };

  const columns: DataTableColumn<ActivityLogEntry>[] = [
    {
      key: "createdAt",
      header: t("TIMESTAMP"),
      className: "text-nowrap small",
      render: (log) => (log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss") : "—"),
    },
    {
      key: "userName",
      header: t("USER"),
      render: (log) => (
        <>
          <div className="small fw-semibold">{log.userName || "—"}</div>
          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{log.userEmail || ""}</div>
        </>
      ),
    },
    { key: "action", header: t("ACTION"), render: (log) => <code className="small bg-body-tertiary px-1 rounded">{log.action}</code> },
    { key: "description", header: t("DESCRIPTION"), className: "small text-truncate", render: (log) => log.description || "—" },
    { key: "httpMethod", header: t("METHOD"), render: (log) => <Badge color="secondary" isLight className="font-monospace">{log.httpMethod || "—"}</Badge> },
    { key: "endpoint", header: t("ENDPOINT"), className: "small text-truncate text-muted", render: (log) => log.endpoint || "—" },
    { key: "ipAddress", header: t("IP_ADDRESS"), className: "small text-muted", render: (log) => log.ipAddress || "—" },
    {
      key: "status",
      header: t("STATUS"),
      render: (log) => <Badge color={log.status === "SUCCESS" ? "success" : "danger"}>{log.status}</Badge>,
    },
  ];

  return (
    <PageWrapper title={t("ACTIVITY_LOGS")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("ACTIVITY_LOGS"), to: "/activity-logs" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title={t("ACTIVITY_LOG_FILTERS")}
            subtitle={t("SEARCH_BY_USER_NAME_OR_ACTION")}
            inputFields={[
              { name: "userName", label: t("USER_NAME"), placeholder: t("ENTER_USER_NAME"), inline: true },
              { name: "action", label: t("ACTION"), placeholder: t("E_G_CREATE_PAWN_TRANSACTION"), inline: true },
            ]}
            onSearch={handleSearch}
            isLoading={loading}
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={logs} keyField={(l) => l.id} isLoading={loading} emptyMessage={t("NO_ACTIVITY_LOGS_FOUND")} />
          </CardBody>
          {totalPages > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              setCurrentPage={setCurrentPage}
              setPageSize={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              label="logs"
            />
          )}
        </Card>
      </Page>
    </PageWrapper>
  );
}
