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
import { t } from "@/lib/lang";

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
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | string[]>("all");
  const [appliedFilters, setAppliedFilters] = useState({
    nic: "",
    phone: "",
    name: "",
    status: "all" as string | string[],
  });

  // UI state
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const { toast } = useToast();

  // Load all customers on mount and when page or filters change
  useEffect(() => {
    fetchAllCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      // Use filter API with all filter parameters
      const response = await apiClient.customers.filter(
        appliedFilters.nic || undefined,
        appliedFilters.phone || undefined,
        appliedFilters.status,
        currentPage,
        pageSize,
        "fullName",
        "asc",
        appliedFilters.name || undefined
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
        title: t("ERROR"),
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
    const name = typeof filters.name === 'string' ? filters.name : undefined;

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
    setFilterPhone(phone || "");
    setFilterName(name || "");
    setFilterStatus(status);
    
    setAppliedFilters({
      nic: nic || "",
      phone: phone || "",
      name: name || "",
      status: status,
    });
    
    setCurrentPage(0);
  };


  const hasActiveFilters = filterNic || filterPhone || filterName || filterStatus !== "all";

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message={t("LOADING_CUSTOMERS")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t("CUSTOMER_MANAGEMENT")}</h1>
      </div>

      {/* Filter Panel using AdvancedSearchPanel */}
      {showFilters && (
        <AdvancedSearchPanel
          title={t("CUSTOMER_SEARCH")}
          subtitle={t("SEARCH_CUSTOMERS_BY_NIC")}
          inputFields={[
            {
              name: "name",
              label: t("CUSTOMER_NAME"),
              placeholder: t("ENTER_CUSTOMER_NAME"),
              inline: true,
            },
            {
              name: "nic",
              label: t("NIC"),
              placeholder: t("ENTER_NIC_NUMBER"),
              inline: true,
            },
            {
              name: "phone",
              label: t("PHONE_NUMBER"),
              placeholder: t("ENTER_PHONE_NUMBER"),
              inline: true,
            },
          ]}
          checkboxGroups={[
            {
              name: "status",
              label: t("STATUS"),
              options: [
                { label: t("ACTIVE"), value: "active" },
                { label: t("INACTIVE"), value: "inactive" },
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
                  <TableHead>{t("PHONE")}</TableHead>
                  <TableHead>{t("ADDRESS")}</TableHead>
                  <TableHead>{t("CUSTOMER_TYPE")}</TableHead>
                  <TableHead>{t("STATUS")}</TableHead>
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
                          {customer.isActive ? t("ACTIVE") : t("INACTIVE")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? t("LOADING_CUSTOMERS") : t("NO_CUSTOMERS_FOUND")}
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
                Showing {results.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} customers
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
                disabled={currentPage >= totalPages - 1 || loading || totalPages === 0}
              >
                <span className="hidden sm:inline">{t("NEXT")}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
