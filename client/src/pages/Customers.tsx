import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { apiClient } from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingOverlay } from "@/components/LoadingOverlay";

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


  const handleApplyFilters = () => {
    setCurrentPage(0);
    fetchAllCustomers();
  };

  const handleClearFilters = () => {
    setFilterNic("");
    setFilterPhone("");
    setFilterStatus("all");
    setCurrentPage(0);
    setShowFilters(false);
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
          className={hasActiveFilters ? "bg-slate-100" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="bg-gray-100 border-2 border-gray-300 rounded-lg shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Filter by NIC</Label>
                <Input
                  placeholder="Enter NIC..."
                  value={filterNic}
                  onChange={(e) => setFilterNic(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Filter by Phone</Label>
                <Input
                  placeholder="Enter phone number..."
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus} disabled={loading}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={loading || !hasActiveFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={handleApplyFilters} disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
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
