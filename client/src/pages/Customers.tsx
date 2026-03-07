import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { apiClient } from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";

interface Customer {
  id: string;
  fullName: string;
  nic: string;
  phone?: string;
  address?: string;
  customerType: string;
  isActive: boolean;
}

export default function Customers() {
  // Filter state
  const [filterNic, setFilterNic] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // UI state
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();

  // Load all customers on mount and when page changes
  useEffect(() => {
    fetchAllCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      // Use filter API with all filter parameters
      const response = await apiClient.customers.filter(
        filterNic || undefined,
        filterPhone || undefined,
        filterStatus,
        currentPage,
        pageSize,
        "fullName",
        "asc"
      );
      console.log("Customers response:", response);

      if (response && response.content) {
        setResults(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const nic = typeof filters.nic === 'string' ? filters.nic : undefined;
    const phone = typeof filters.phone === 'string' ? filters.phone : undefined;

    // Handle status - can be array or string
    let status = "all";
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        // If both active and inactive are selected, show all
        if (filters.status.length === 1) {
          status = filters.status[0];
        }
      } else if (typeof filters.status === 'string') {
        status = filters.status;
      }
    }

    setFilterNic(nic || "");
    setFilterPhone(phone || "");
    setFilterStatus(status);
    setCurrentPage(0);
    fetchAllCustomers();
  };


  const hasActiveFilters = filterNic || filterPhone || filterStatus !== "all";

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading customers..." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          disabled={loading}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-slate-600 text-white">
              {[filterNic, filterPhone, filterStatus !== "all" ? filterStatus : ""].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel using AdvancedSearchPanel */}
      {showFilters && (
        <AdvancedSearchPanel
          title="Customer Search"
          subtitle="Search customers by NIC, phone number, or status"
          inputFields={[
            {
              name: "nic",
              label: "NIC",
              placeholder: "Enter NIC number",
            },
            {
              name: "phone",
              label: "Phone Number",
              placeholder: "Enter phone number",
            },
          ]}
          checkboxGroups={[
            {
              name: "status",
              label: "Status",
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
              defaultChecked: true,
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
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Customer Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length > 0 ? (
                  results.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.fullName}</TableCell>
                      <TableCell>{customer.nic}</TableCell>
                      <TableCell>{customer.phone || "—"}</TableCell>
                      <TableCell className="max-w-md truncate">{customer.address || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.customerType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? "default" : "secondary"}>
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? "Loading customers..." : "No customers found"}
                    </TableCell>
                  </TableRow>
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
                Showing {results.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} customers
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
                disabled={currentPage >= totalPages - 1 || loading || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
