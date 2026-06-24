import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";
import { t } from "@/lib/lang";

export default function Blacklist() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [reason, setReason] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [policeReportDate, setPoliceReportDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state
  const [showFilters, setShowFilters] = useState(true);
  const [filterNic, setFilterNic] = useState("");
  const [filterPoliceReport, setFilterPoliceReport] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | string[]>("all");
  const [appliedFilters, setAppliedFilters] = useState({
    nic: "",
    policeReport: "",
    status: "all" as string | string[],
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const { nic, policeReport, status } = appliedFilters;

      // Use filter API if any filters are provided, otherwise use paginated API
      const hasFilters = nic || policeReport || status !== "all";

      const data = hasFilters
        ? await apiClient.blacklist.filter(
          appliedFilters.nic || undefined,
          appliedFilters.policeReport || undefined,
          appliedFilters.status !== "all" ? appliedFilters.status : undefined,
          currentPage,
          pageSize,
          'createdAt',
          'desc'
        )
        : await apiClient.blacklist.getPaginated(currentPage, pageSize, 'createdAt', 'desc');

      setBlacklist(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch blacklist:', error);
      toast({
        title: t("ERROR"),
        description: t("FAILED_TO_FETCH_BLACKLIST"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const nic = typeof filters.nic === 'string' ? filters.nic : undefined;
    const policeReport = typeof filters.policeReport === 'string' ? filters.policeReport : undefined;

    // Handle status - allow arrays for multiple selection
    let status: string | string[] = "all";
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          status = filters.status;
        }
      } else if (typeof filters.status === 'string') {
        status = filters.status;
      }
    }

    setFilterNic(nic || "");
    setFilterPoliceReport(policeReport || "");
    setFilterStatus(status);

    setAppliedFilters({
      nic: nic || "",
      policeReport: policeReport || "",
      status: status,
    });

    setCurrentPage(0); // Reset to first page when filtering
  };

  const hasActiveFilters = filterNic !== "" || filterPoliceReport !== "" || filterStatus !== "all";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.blacklist.create({
        customerName,
        customerNic,
        reason,
        policeReportNumber: policeReportNumber || null,
        policeReportDate: policeReportDate || null,
        branchId: user?.branchId,
        addedBy: user?.id,
        isActive: true,
      });
      toast({
        title: t("SUCCESS"),
        description: t("CUSTOMER_ADDED_TO_BLACKLIST"),
      });
      setShowDialog(false);
      setCustomerName("");
      setCustomerNic("");
      setReason("");
      setPoliceReportNumber("");
      setPoliceReportDate("");
      await fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to blacklist",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      await apiClient.blacklist.toggleActive(id);
      toast({
        title: t("SUCCESS"),
        description: `Blacklist entry ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      await fetchBlacklist();
    } catch (error: any) {
      toast({
        title: t("ERROR"),
        description: "Failed to update blacklist status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message={t("LOADING")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t("BLACKLIST_MANAGEMENT")}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDialog(true)}
            disabled={loading}
          >
            {loading ? t("LOADING") : t("ADD_TO_BLACKLIST")}
          </Button>
        </div>
      </div>

      {/* Filter Panel using AdvancedSearchPanel */}
      {showFilters && (
        <AdvancedSearchPanel
          title={t("BLACKLIST_SEARCH")}
          subtitle={t("SEARCH_BLACKLISTED_ENTRIES")}
          inputFields={[
            {
              name: "nic",
              label: t("NIC"),
              placeholder: t("ENTER_NIC_NUMBER"),
              inline: true,
            },
            {
              name: "policeReport",
              label: t("POLICE_REPORT"),
              placeholder: t("ENTER_REPORT_NUMBER"),
              inline: true,
            },
          ]}
          checkboxGroups={[
            {
              name: "status",
              label: t("STATUS"),
              options: [
                { label: t("ACTIVE"), value: "active" },
                { label: t("REMOVED"), value: "inactive" },
              ],
              defaultChecked: true,
              inline: true,
            },
          ]}
          onSearch={handleSearch}
          isLoading={loading}
          backgroundColor="bg-gray-50"
        />
      )}

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("NAME")}</TableHead>
                  <TableHead>{t("NIC")}</TableHead>
                  <TableHead>{t("REASON")}</TableHead>
                  <TableHead>{t("POLICE_REPORT")}</TableHead>
                  <TableHead>{t("STATUS")}</TableHead>
                  <TableHead>{t("ACTIONS")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklist.length > 0 ? (
                  blacklist.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.customerName}</TableCell>
                      <TableCell>{e.customerNic}</TableCell>
                      <TableCell className="max-w-md truncate">{e.reason}</TableCell>
                      <TableCell>
                        {e.policeReportNumber ? (
                          <div className="text-sm">
                            <div>{e.policeReportNumber}</div>
                            {e.policeReportDate && <div className="text-muted-foreground">{new Date(e.policeReportDate).toLocaleDateString()}</div>}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell><Badge variant={e.isActive ? "destructive" : "secondary"}>{e.isActive ? "Active" : "Removed"}</Badge></TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(e.id, e.isActive)}
                          title={e.isActive ? "Remove from blacklist" : "Restore to blacklist"}
                          className={e.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          disabled={loading}
                        >
                          {e.isActive ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? t("LOADING_ENTRIES") : t("NO_BLACKLIST_ENTRIES_FOUND")}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">{t("ROWS_PER_PAGE")}</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(0);
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-16 sm:w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {blacklist.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("PREVIOUS")}</span>
              </Button>
              <span className="text-xs sm:text-sm px-1 sm:px-2">
                {t("PAGE")} {totalElements > 0 ? currentPage + 1 : 0} {t("OF")} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0 || loading}
              >
                <span className="hidden sm:inline">{t("NEXT")}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("ADD_TO_BLACKLIST")}</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>{t("CUSTOMER_NAME")}</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. John Doe" disabled={submitting} /></div>
            <div><Label>{t("NIC")}</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required placeholder="e.g. 123456789V" disabled={submitting} /></div>
            <div><Label>{t("REASON")}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder={t("DESCRIBE_REASON_FOR_BLACKLISTING")} disabled={submitting} /></div>
            <div><Label>{t("POLICE_REPORT_NUMBER_OPTIONAL")}</Label><Input value={policeReportNumber} onChange={(e) => setPoliceReportNumber(e.target.value)} placeholder="e.g. PR-2026-001" disabled={submitting} /></div>
            <div><Label>{t("POLICE_REPORT_DATE_OPTIONAL")}</Label><Input type="date" value={policeReportDate} onChange={(e) => setPoliceReportDate(e.target.value)} disabled={submitting} /></div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t("ADDING_TO_BLACKLIST") : t("ADD_TO_BLACKLIST")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
