import { useEffect, useState } from "react";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/lang";

interface BlacklistEntry {
  id: string;
  customerName: string;
  customerNic: string;
  reason: string;
  policeReportNumber?: string;
  policeReportDate?: string;
  isActive: boolean;
}

export default function Blacklist() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [reason, setReason] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [policeReportDate, setPoliceReportDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [appliedFilters, setAppliedFilters] = useState({
    nic: "",
    policeReport: "",
    status: "all" as string,
  });

  const { user } = useAuth();

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const { nic, policeReport, status } = appliedFilters;
      const hasFilters = nic || policeReport || status !== "all";

      const data = hasFilters
        ? await apiClient.blacklist.filter(
            nic || undefined,
            policeReport || undefined,
            status !== "all" ? status : undefined,
            currentPage,
            pageSize,
            "createdAt",
            "desc"
          )
        : await apiClient.blacklist.getPaginated(currentPage, pageSize, "createdAt", "desc");

      setBlacklist(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch blacklist:", error);
      notify({ title: t("ERROR"), description: t("FAILED_TO_FETCH_BLACKLIST"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const nic = typeof filters.nic === "string" ? filters.nic : "";
    const policeReport = typeof filters.policeReport === "string" ? filters.policeReport : "";
    // The backend only accepts a single status value, so only the string case is applied here.
    const status = typeof filters.status === "string" ? filters.status : "all";

    setAppliedFilters({ nic, policeReport, status });
    setCurrentPage(0);
  };

  const handleAdd = async () => {
    setSubmitting(true);
    try {
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
      notify({ title: t("SUCCESS"), description: t("CUSTOMER_ADDED_TO_BLACKLIST"), variant: "success" });
      setShowDialog(false);
      setCustomerName("");
      setCustomerNic("");
      setReason("");
      setPoliceReportNumber("");
      setPoliceReportDate("");
      await fetchBlacklist();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add to blacklist";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (entry: BlacklistEntry) => {
    try {
      setLoading(true);
      await apiClient.blacklist.toggleActive(entry.id);
      notify({ title: t("SUCCESS"), description: `Blacklist entry ${entry.isActive ? "deactivated" : "activated"} successfully`, variant: "success" });
      await fetchBlacklist();
    } catch (error) {
      notify({ title: t("ERROR"), description: "Failed to update blacklist status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const columns: DataTableColumn<BlacklistEntry>[] = [
    { key: "customerName", header: t("NAME") },
    { key: "customerNic", header: t("NIC") },
    { key: "reason", header: t("REASON"), className: "text-truncate" },
    {
      key: "policeReportNumber",
      header: t("POLICE_REPORT"),
      render: (e) =>
        e.policeReportNumber ? (
          <div className="small">
            <div>{e.policeReportNumber}</div>
            {e.policeReportDate && <div className="text-muted">{new Date(e.policeReportDate).toLocaleDateString()}</div>}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "isActive",
      header: t("STATUS"),
      render: (e) => <Badge color={e.isActive ? "danger" : "secondary"} isLight>{e.isActive ? "Active" : "Removed"}</Badge>,
    },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (e) => (
        <Button
          color={e.isActive ? "danger" : "success"}
          isLight
          icon={e.isActive ? "ShieldOff" : "Shield"}
          onClick={() => toggleActive(e)}
          title={e.isActive ? "Remove from blacklist" : "Restore to blacklist"}
          isDisable={loading}
          aria-label="Toggle blacklist status"
        />
      ),
    },
  ];

  return (
    <PageWrapper title={t("BLACKLIST_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("BLACKLIST_MANAGEMENT"), to: "/blacklist" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="primary" icon="Block" onClick={() => setShowDialog(true)} isDisable={loading}>
            {t("ADD_TO_BLACKLIST")}
          </Button>
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title={t("BLACKLIST_SEARCH")}
            subtitle={t("SEARCH_BLACKLISTED_ENTRIES")}
            inputFields={[
              { name: "nic", label: t("NIC"), placeholder: t("ENTER_NIC_NUMBER"), inline: true },
              { name: "policeReport", label: t("POLICE_REPORT"), placeholder: t("ENTER_REPORT_NUMBER"), inline: true },
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
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={blacklist} keyField={(e) => e.id} isLoading={loading} emptyMessage={t("NO_BLACKLIST_ENTRIES_FOUND")} />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="entries"
          />
        </Card>
      </Page>

      <FormModal
        isOpen={showDialog}
        setIsOpen={setShowDialog}
        title={t("ADD_TO_BLACKLIST")}
        onSubmit={handleAdd}
        isSubmitting={submitting}
        submitLabel={t("ADD_TO_BLACKLIST")}
      >
        <FormGroup id="blacklistName" label={t("CUSTOMER_NAME")} isFloating>
          <Input value={customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)} required placeholder="e.g. John Doe" disabled={submitting} />
        </FormGroup>
        <FormGroup id="blacklistNic" label={t("NIC")} isFloating>
          <Input value={customerNic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerNic(e.target.value)} required placeholder="e.g. 123456789V" disabled={submitting} />
        </FormGroup>
        <FormGroup id="blacklistReason" label={t("REASON")} isFloating>
          <Input value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} required placeholder={t("DESCRIBE_REASON_FOR_BLACKLISTING")} disabled={submitting} />
        </FormGroup>
        <FormGroup id="blacklistPoliceReportNumber" label={t("POLICE_REPORT_NUMBER_OPTIONAL")} isFloating>
          <Input value={policeReportNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPoliceReportNumber(e.target.value)} placeholder="e.g. PR-2026-001" disabled={submitting} />
        </FormGroup>
        <FormGroup id="blacklistPoliceReportDate" label={t("POLICE_REPORT_DATE_OPTIONAL")} isFloating>
          <Input type="date" value={policeReportDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPoliceReportDate(e.target.value)} disabled={submitting} />
        </FormGroup>
      </FormModal>
    </PageWrapper>
  );
}
