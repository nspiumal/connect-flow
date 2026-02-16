import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { toast } = useToast();

  // Load all customers on mount and when page changes
  useEffect(() => {
    if (!query.trim()) {
      fetchAllCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.customers.getAll(currentPage, pageSize, "fullName", "asc");
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

  const handleSearch = async () => {
    if (!query.trim()) {
      setCurrentPage(0);
      fetchAllCustomers();
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.customers.search(query.trim(), 0, pageSize, "fullName", "asc");
      console.log("Search response:", response);

      if (response && response.content) {
        setResults(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(0);

        if (response.content.length === 0) {
          toast({
            title: "No Results",
            description: `No customers found matching "${query}"`,
          });
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Error",
        description: "Failed to search customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading customers..." />

      <h1 className="text-2xl font-bold">Customer Search</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by NIC or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          disabled={loading}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {query ? `Search Results for "${query}"` : "All Customers"}
            </CardTitle>
            <Button
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.fullName}</TableCell>
                    <TableCell>{customer.nic}</TableCell>
                    <TableCell>{customer.phone || "—"}</TableCell>
                    <TableCell>{customer.address || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.customerType}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading customers..." : "No customers found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Rows per page:</Label>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
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
