import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, Info } from "lucide-react";
import apiClient from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";
import { t } from "@/lib/lang";

export default function ProfitedItems() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();

  const [profitedItems, setProfitedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter state
  const [filterPawnId, setFilterPawnId] = useState("");
  const [filterCustomerNic, setFilterCustomerNic] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    pawnId: "",
    customerNic: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Check access on mount
  useEffect(() => {
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "MANAGER") {
      toast({
        title: t("ACCESS_DENIED"),
        description: t("ONLY_ADMIN_CAN_ACCESS_PROFITED"),
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [role, navigate, toast]);

  const fetchProfitedItems = async () => {
    try {
      setLoading(true);

      if (appliedFilters.pawnId || appliedFilters.customerNic) {
        // Use search API if filters applied
        const response = await apiClient.profitedTransactions.search(
          appliedFilters.pawnId || undefined,
          appliedFilters.customerNic || undefined,
          currentPage,
          pageSize
        );
        setProfitedItems(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        // Use paginated API if no filters
        const response = await apiClient.profitedTransactions.getPaginated(
          currentPage,
          pageSize,
          "profitRecordedDate",
          "desc"
        );
        setProfitedItems(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      }
    } catch (error: any) {
      console.error("Failed to fetch profited items:", error);
      toast({
        title: "Error",
        description: "Failed to load forfeited items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN" || role === "SUPERADMIN" || role === "MANAGER") {
      fetchProfitedItems();
    }
  }, [currentPage, pageSize, appliedFilters, role]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const pawnId = typeof filters.pawnId === 'string' ? filters.pawnId : undefined;
    const customerNic = typeof filters.customerNic === 'string' ? filters.customerNic : undefined;

    setFilterPawnId(pawnId || "");
    setFilterCustomerNic(customerNic || "");

    setAppliedFilters({
      pawnId: pawnId || "",
      customerNic: customerNic || "",
    });

    setCurrentPage(0);
  };

  const hasActiveFilters = filterPawnId || filterCustomerNic;

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading forfeited items..." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Forfeited Items</h1>
      </div>

      {/* Advanced Search Panel */}
      {showFilters && (
        <AdvancedSearchPanel
          title="Forfeited Items Search"
          subtitle="Search forfeited transactions by Receipt No or Customer NIC"
          inputFields={[
            {
              name: "pawnId",
              label: "Receipt No",
              placeholder: "Enter Receipt No",
            },
            {
              name: "customerNic",
              label: "Customer NIC",
              placeholder: "Enter NIC number",
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
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Forfeit Amount</TableHead>
                  <TableHead>Forfeit Date</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitedItems.length > 0 ? (
                  profitedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.pawnId || "N/A"}</TableCell>
                      <TableCell>{item.customerName || "N/A"}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        Rs. {Number(item.profitAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.profitRecordedDate)}
                      </TableCell>
                      <TableCell>{item.recordedByName || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/transactions/info/${item.transactionId}`)}
                          disabled={loading}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No forfeited items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Rows per page:</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(0);
                  }}
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
                Showing {profitedItems.length > 0 ? currentPage * pageSize + 1 : 0} to{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} items
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <span className="text-xs sm:text-sm px-1 sm:px-2">
                Page {totalElements > 0 ? currentPage + 1 : 0} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1 || loading || totalPages === 0}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

