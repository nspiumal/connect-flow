import { useState, useEffect } from "react";
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
import { notify } from "@/components/facit/notify";
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
  const [appliedFilters, setAppliedFilters] = useState({
    nic: "",
    phone: "",
    name: "",
    status: "all" as string | string[],
  });

  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchAllCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
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

      if (response && response.content) {
        setResults(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      notify({ title: t("ERROR"), description: "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const nic = typeof filters.nic === "string" ? filters.nic : undefined;
    const phone = typeof filters.phone === "string" ? filters.phone : undefined;
    const name = typeof filters.name === "string" ? filters.name : undefined;

    let status: string | string[] = "all";
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) status = filters.status;
      } else if (typeof filters.status === "string") {
        status = filters.status;
      }
    }

    setAppliedFilters({ nic: nic || "", phone: phone || "", name: name || "", status });
    setCurrentPage(0);
  };

  const columns: DataTableColumn<Customer>[] = [
    { key: "fullName", header: t("NAME") },
    { key: "nic", header: t("NIC") },
    { key: "phone", header: t("PHONE"), render: (c) => c.phone || "—" },
    { key: "address", header: t("ADDRESS"), className: "text-truncate", render: (c) => c.address || "—" },
    { key: "customerType", header: t("CUSTOMER_TYPE"), render: (c) => <Badge color="secondary" isLight>{c.customerType}</Badge> },
    {
      key: "isActive",
      header: t("STATUS"),
      render: (c) => <Badge color={c.isActive ? "success" : "secondary"} isLight>{c.isActive ? t("ACTIVE") : t("INACTIVE")}</Badge>,
    },
  ];

  return (
    <PageWrapper title={t("CUSTOMER_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("CUSTOMER_MANAGEMENT"), to: "/customers" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title={t("CUSTOMER_SEARCH")}
            subtitle={t("SEARCH_CUSTOMERS_BY_NIC")}
            inputFields={[
              { name: "name", label: t("CUSTOMER_NAME"), placeholder: t("ENTER_CUSTOMER_NAME"), inline: true },
              { name: "nic", label: t("NIC"), placeholder: t("ENTER_NIC_NUMBER"), inline: true },
              { name: "phone", label: t("PHONE_NUMBER"), placeholder: t("ENTER_PHONE_NUMBER"), inline: true },
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
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={results}
              keyField={(c) => c.id}
              isLoading={loading}
              emptyMessage={t("NO_CUSTOMERS_FOUND")}
            />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="customers"
          />
        </Card>
      </Page>
    </PageWrapper>
  );
}
