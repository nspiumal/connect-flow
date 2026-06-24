import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { apiClient } from "@/integrations/api";
import { format } from "date-fns";
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
  const [showFilters, setShowFilters] = useState(true);

  const [filterUserName, setFilterUserName] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = useCallback(async (userName?: string, action?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.activityLogs.search(
        userName || undefined,
        action || undefined,
        currentPage,
        pageSize
      );
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
    const userName = typeof filters.userName === "string" ? filters.userName : "";
    const action   = typeof filters.action   === "string" ? filters.action   : "";
    setFilterUserName(userName);
    setFilterAction(action);
    setCurrentPage(0);
  };

  const hasActiveFilters = filterUserName !== "" || filterAction !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("ACTIVITY_LOGS")}</h1>
          <p className="text-sm text-muted-foreground">{t("TRACK_ALL_USER_ACTIONS")}</p>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showFilters && (
        <AdvancedSearchPanel
          title={t("ACTIVITY_LOG_FILTERS")}
          subtitle={t("SEARCH_BY_USER_NAME_OR_ACTION")}
          inputFields={[
            { name: "userName", label: t("USER_NAME"), placeholder: t("ENTER_USER_NAME"), inline: true },
            { name: "action",   label: t("ACTION"),    placeholder: t("E_G_CREATE_PAWN_TRANSACTION"), inline: true },
          ]}
          onSearch={handleSearch}
          isLoading={loading}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("TIMESTAMP")}</TableHead>
                <TableHead>{t("USER")}</TableHead>
                <TableHead>{t("ACTION")}</TableHead>
                <TableHead>{t("DESCRIPTION")}</TableHead>
                <TableHead>{t("METHOD")}</TableHead>
                <TableHead>{t("ENDPOINT")}</TableHead>
                <TableHead>{t("IP_ADDRESS")}</TableHead>
                <TableHead>{t("STATUS")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t("LOADING")}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t("NO_ACTIVITY_LOGS_FOUND")}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {log.createdAt
                        ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail || ""}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.action}</code>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {log.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.httpMethod || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                      {log.endpoint || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "SUCCESS" ? "default" : "destructive"}
                        className={log.status === "SUCCESS" ? "bg-green-600 text-white" : ""}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="text-xs sm:text-sm">
            Showing {logs.length > 0 ? currentPage * pageSize + 1 : 0} to{" "}
            {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} logs
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <span>{t("ROWS")}</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="hidden sm:inline">{t("PAGE")} {totalElements > 0 ? currentPage + 1 : 0} {t("OF")} {totalPages}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
