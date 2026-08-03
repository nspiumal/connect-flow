import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import apiClient from "@/integrations/api";
import { notify } from "@/components/facit/notify";
import { usePermission } from "@/hooks/usePermission";
import { t } from "@/lib/lang";

interface ProfitedItem {
  id: string;
  pawnId?: string;
  customerName?: string;
  profitAmount?: number;
  profitRecordedDate?: string;
  recordedByName?: string;
  transactionId: string;
}

export default function ProfitedItems() {
  const navigate = useNavigate();
  const has = usePermission();

  const [profitedItems, setProfitedItems] = useState<ProfitedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({ pawnId: "", customerNic: "" });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (!has("profit.view.list")) {
      notify({ title: t("ACCESS_DENIED"), description: t("ONLY_ADMIN_CAN_ACCESS_PROFITED"), variant: "destructive" });
      navigate("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchProfitedItems = async () => {
    try {
      setLoading(true);

      const response =
        appliedFilters.pawnId || appliedFilters.customerNic
          ? await apiClient.profitedTransactions.search(appliedFilters.pawnId || undefined, appliedFilters.customerNic || undefined, currentPage, pageSize)
          : await apiClient.profitedTransactions.getPaginated(currentPage, pageSize, "profitRecordedDate", "desc");

      setProfitedItems(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch profited items:", error);
      notify({ title: "Error", description: "Failed to load forfeited items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (has("profit.view.list")) fetchProfitedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const pawnId = typeof filters.pawnId === "string" ? filters.pawnId : "";
    const customerNic = typeof filters.customerNic === "string" ? filters.customerNic : "";
    setAppliedFilters({ pawnId, customerNic });
    setCurrentPage(0);
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const columns: DataTableColumn<ProfitedItem>[] = [
    { key: "pawnId", header: "Receipt No", className: "font-monospace fw-semibold", render: (i) => i.pawnId || "N/A" },
    { key: "customerName", header: "Customer", render: (i) => i.customerName || "N/A" },
    { key: "profitAmount", header: "Forfeit Amount", className: "fw-semibold text-success", render: (i) => `Rs. ${Number(i.profitAmount || 0).toLocaleString()}` },
    { key: "profitRecordedDate", header: "Forfeit Date", className: "small text-muted", render: (i) => formatDate(i.profitRecordedDate) },
    { key: "recordedByName", header: "Recorded By", render: (i) => i.recordedByName || "N/A" },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (i) => (
        <Button color="dark" isLight onClick={() => navigate(`/transactions/info/${i.transactionId}`)} isDisable={loading}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <PageWrapper title="Forfeited Items">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Forfeited Items", to: "/profited-items" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title="Forfeited Items Search"
            subtitle="Search forfeited transactions by Receipt No or Customer NIC"
            inputFields={[
              { name: "pawnId", label: "Receipt No", placeholder: "Enter Receipt No" },
              { name: "customerNic", label: "Customer NIC", placeholder: "Enter NIC number" },
            ]}
            onSearch={handleSearch}
            isLoading={loading}
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={profitedItems} keyField={(i) => i.id} isLoading={loading} emptyMessage="No forfeited items found" />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="items"
          />
        </Card>
      </Page>
    </PageWrapper>
  );
}
