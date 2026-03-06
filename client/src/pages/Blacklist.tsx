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
import { CommonSearch, SearchField } from "@/components/CommonSearch";

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
  const [showFilters, setShowFilters] = useState(false);
  const [filterNic, setFilterNic] = useState("");
  const [filterPoliceReport, setFilterPoliceReport] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBlacklist = async (nic?: string | null, policeReport?: string | null, status?: string | null) => {
    try {
      setLoading(true);

      // Use filter API if any filters are provided, otherwise use paginated API
      const hasFilters = nic || policeReport || status;

      const data = hasFilters
        ? await apiClient.blacklist.filter(nic || undefined, policeReport || undefined, status || undefined, currentPage, pageSize, 'createdAt', 'desc')
        : await apiClient.blacklist.getPaginated(currentPage, pageSize, 'createdAt', 'desc');

      setBlacklist(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch blacklist:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blacklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handleSearch = (filters: Record<string, string | null>) => {
    const { nic, policeReport, status } = filters;
    setFilterNic(nic || "");
    setFilterPoliceReport(policeReport || "");
    setFilterStatus(status || "all");
    setCurrentPage(0); // Reset to first page when filtering
    fetchBlacklist(nic, policeReport, status);
  };

  const handleClearFilters = () => {
    setFilterNic("");
    setFilterPoliceReport("");
    setFilterStatus("all");
    setCurrentPage(0);
    fetchBlacklist();
  };

  const searchFields: SearchField[] = [
    {
      name: "nic",
      label: "NIC",
      type: "text",
      placeholder: "Enter NIC...",
    },
    {
      name: "policeReport",
      label: "Police Report Number",
      type: "text",
      placeholder: "Enter police report number...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Removed", value: "inactive" },
      ],
    },
  ];

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
        title: "Success",
        description: "Customer added to blacklist successfully",
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
        title: "Success",
        description: `Blacklist entry ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      await fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update blacklist status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading blacklist..." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blacklist Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-slate-600 text-white">
                {[filterNic, filterPoliceReport, filterStatus !== "all" ? filterStatus : ""].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setShowDialog(true)}
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Loading..." : "Add to Blacklist"}
          </Button>
        </div>
      </div>

      {/* Filter Panel using CommonSearch */}
      {showFilters && (
        <CommonSearch
          fields={searchFields}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          isLoading={loading}
          title="Blacklist Filters"
          backgroundColor="bg-gray-100"
          borderColor="border-gray-300"
        />
      )}

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Police Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? "Loading entries..." : "No blacklist entries found"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Rows per page:</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(0);
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-20">
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
              <div className="text-sm text-muted-foreground">
                Showing {blacklist.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {totalElements > 0 ? currentPage + 1 : 0} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Blacklist</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Customer Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. John Doe" disabled={submitting} /></div>
            <div><Label>NIC</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required placeholder="e.g. 123456789V" disabled={submitting} /></div>
            <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Describe the reason for blacklisting" disabled={submitting} /></div>
            <div><Label>Police Report Number (Optional)</Label><Input value={policeReportNumber} onChange={(e) => setPoliceReportNumber(e.target.value)} placeholder="e.g. PR-2026-001" disabled={submitting} /></div>
            <div><Label>Police Report Date (Optional)</Label><Input type="date" value={policeReportDate} onChange={(e) => setPoliceReportDate(e.target.value)} disabled={submitting} /></div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Adding to Blacklist..." : "Add to Blacklist"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
