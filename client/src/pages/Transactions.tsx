import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import NumberInput from "@/components/facit/NumberInput";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { usePermission } from "@/hooks/usePermission";
import { useActiveInterestRates, useItemTypes } from "@/hooks/useLookups";
import { STATUS_LABEL, STATUS_COLOR, BLACKLISTED_STATUS } from "@/lib/transactionStatus";

interface OutstandingBalance {
  total?: number;
  principal?: number;
  accrualInterest?: number;
  charges?: number;
}
interface Transaction {
  id: string;
  pawnId?: string; pawn_id?: string;
  customerName?: string; customer_name?: string;
  customerNic?: string; customer_nic?: string;
  loanAmount?: number; loan_amount?: number;
  remainingBalance?: number;
  interestRatePercent?: number; interest_rate_percent?: number;
  maturityDate?: string; maturity_date?: string;
  status: string;
}

function isRowOverdue(t: Transaction) {
  const maturityDate = t.maturityDate || t.maturity_date;
  if (!maturityDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maturity = new Date(maturityDate);
  maturity.setHours(0, 0, 0, 0);
  return t.status === "Active" && maturity < today;
}

function rowStatusText(t: Transaction) {
  if (isRowOverdue(t) || t.status === "Overdue") return "Overdue";
  return t.status === "Profited" ? "Forfeited" : t.status;
}

function rowRemainingBalanceText(t: Transaction, balances: Record<string, OutstandingBalance>) {
  if (t.status === "Active" && balances[t.id]) return balances[t.id].total ?? 0;
  if (t.status === "Active" && t.remainingBalance) return Number(t.remainingBalance);
  if (t.status === "Completed") return "Settled";
  if (t.status === "Profited") return "Forfeited";
  return "";
}

const escapeCsvValue = (value: unknown) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    pawnId: "",
    customerNic: "",
    minAmount: "",
    maxAmount: "",
    status: "all" as string | string[],
  });
  const rates = useActiveInterestRates();
  const itemTypes = useItemTypes();
  const [outstandingBalances, setOutstandingBalances] = useState<Record<string, OutstandingBalance>>({});

  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<"A" | "ALL">("A");
  const [patternUnlocked, setPatternUnlocked] = useState(false);
  const [patternBuffer, setPatternBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const has = usePermission();
  const navigate = useNavigate();

  // Mock branchId - in real app this would come from user context
  const branchId = "mock-branch-id";

  // Create-transaction form state
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [idType, setIdType] = useState("NIC");
  const [gender, setGender] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCondition, setItemCondition] = useState("Good");
  const [itemWeight, setItemWeight] = useState("");
  const [itemKarat, setItemKarat] = useState("24");
  const [appraisedValue, setAppraisedValue] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("12");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const minAmount = appliedFilters.minAmount.trim() !== "" ? Number(appliedFilters.minAmount) : undefined;
      const maxAmount = appliedFilters.maxAmount.trim() !== "" ? Number(appliedFilters.maxAmount) : undefined;

      const response = await apiClient.pawnTransactions.searchAdvanced({
        // NOTE: searchAdvanced has no pawnId/receipt-no param (backend gap) — the
        // "Receipt No" filter field has never actually filtered results; not a
        // regression introduced by this migration, left as-is (see summary).
        customerNic: appliedFilters.customerNic.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
        maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
        patternMode: categoryFilter === "A" ? "A" : undefined,
        page: currentPage,
        size: pageSize,
        sortBy: "pawnDate",
        sortDir: "desc",
      });
      setTransactions(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);

      // Fetch outstanding balances (including accrued interest) for all active transactions.
      // Skip entirely when the role can't view redemption balances — the endpoint would 403.
      const activeTransactions = has("redemption.view.balance")
        ? (response.content || []).filter((t: Transaction) => t.status === "Active")
        : [];
      if (activeTransactions.length > 0) {
        const balances: Record<string, OutstandingBalance> = {};
        const results = await Promise.allSettled(
          activeTransactions.map((transaction) => apiClient.pawnRedemptions.getOutstandingBalance(transaction.id))
        );
        results.forEach((result, index) => {
          const transaction = activeTransactions[index];
          if (result.status === "fulfilled") {
            balances[transaction.id] = result.value;
          } else {
            console.error(`Failed to fetch balance for transaction ${transaction.id}:`, result.reason);
            balances[transaction.id] = {
              total: transaction.remainingBalance || transaction.loanAmount,
              principal: transaction.remainingBalance || transaction.loanAmount,
              accrualInterest: 0,
              charges: 0,
            };
          }
        });
        setOutstandingBalances(balances);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      notify({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions().catch((error) => console.error("Error loading transactions:", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters, categoryFilter]);

  // TND pattern detection to unlock category B (a filterable admin easter egg, not a security boundary)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      const currentTime = Date.now();
      const key = e.key.toUpperCase();

      if (currentTime - lastKeyTime > 2000) {
        setPatternBuffer(key);
      } else {
        setPatternBuffer((prev) => prev + key);
      }
      setLastKeyTime(currentTime);

      const newBuffer = currentTime - lastKeyTime > 2000 ? key : patternBuffer + key;
      if (newBuffer.length >= 3) {
        const lastThree = newBuffer.slice(-3);
        if (lastThree === "TND" && !patternUnlocked) {
          setPatternUnlocked(true);
          setCategoryFilter("ALL");
          setPatternBuffer("");
          notify({ title: "🔓 All Categories Unlocked", description: "Search will now include both A and B categories" });
          fetchTransactions();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKeyTime, patternBuffer, patternUnlocked]);

  const handleCreate = async () => {
    if (!customerName || !customerNic || !customerAddress || !selectedItemTypeId || !loanAmount || !selectedRateId || !periodMonths) {
      notify({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const selectedRate = rates.find((r) => r.id === selectedRateId);
      if (!selectedRate) {
        notify({ title: "Error", description: "Please select a valid interest rate", variant: "destructive" });
        setLoading(false);
        return;
      }

      const selectedItemType = itemTypes.find((t) => t.id === selectedItemTypeId);
      if (!selectedItemType) {
        notify({ title: "Error", description: "Please select a valid item type", variant: "destructive" });
        setLoading(false);
        return;
      }

      const fullItemDescription = selectedItemType.name + (itemDescription.trim() ? ` - ${itemDescription.trim()}` : "");

      const today = new Date();
      const pawnDate = today.toISOString().split("T")[0];
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths, 10));
      const maturityDateStr = maturityDate.toISOString().split("T")[0];

      const transactionData = {
        customerName,
        customerNic,
        idType,
        gender,
        customerAddress,
        customerPhone,
        customerType: "Regular",
        patternMode: categoryFilter,
        itemDescription: fullItemDescription,
        itemTypeId: selectedItemTypeId,
        itemContent,
        itemCondition,
        itemWeightGrams: itemWeight ? parseFloat(itemWeight) : 0,
        itemKarat: parseInt(itemKarat, 10),
        appraisedValue: appraisedValue ? parseFloat(appraisedValue) : 0,
        loanAmount: parseFloat(loanAmount),
        interestRateId: selectedRateId,
        interestRatePercent: selectedRate.rate_percent || selectedRate.ratePercent,
        periodMonths: parseInt(periodMonths, 10),
        pawnDate,
        maturityDate: maturityDateStr,
        remarks,
        imageUrls: imagePreviews,
      };

      const response = await apiClient.pawnTransactions.create(transactionData);

      notify({ title: "Success", description: `Transaction created successfully! Receipt No: ${response.pawnId || response.pawn_id}`, variant: "success" });

      setCustomerName(""); setCustomerNic(""); setIdType("NIC"); setGender("");
      setCustomerAddress(""); setCustomerPhone(""); setSelectedItemTypeId(""); setItemDescription("");
      setItemContent(""); setItemCondition("Good"); setItemWeight(""); setItemKarat("24");
      setAppraisedValue(""); setLoanAmount(""); setSelectedRateId(""); setPeriodMonths("6");
      setRemarks(""); setUploadedImages([]); setImagePreviews([]);

      setShowCreate(false);
      fetchTransactions();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      const message = error instanceof Error ? error.message : "Failed to create transaction";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
      setUploadedImages((prev) => [...prev, ...files]);
      notify({ title: "Images selected", description: `${files.length} image(s) selected. They will be uploaded when you create the transaction.` });
    } catch (error) {
      console.error("Error processing images:", error);
      notify({ title: "Error", description: "Failed to process images", variant: "destructive" });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = (filters: Record<string, FilterValue>) => {
    const pawnId = typeof filters.pawnId === "string" ? filters.pawnId : undefined;
    const customerNic = typeof filters.customerNic === "string" ? filters.customerNic : undefined;
    const minAmount = typeof filters.minAmount === "string" ? filters.minAmount : undefined;
    const maxAmount = typeof filters.maxAmount === "string" ? filters.maxAmount : undefined;

    let status: string | string[] = "all";
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) status = filters.status;
      } else if (typeof filters.status === "string") {
        status = filters.status;
      }
    }

    setAppliedFilters({
      pawnId: pawnId || "",
      customerNic: customerNic || "",
      minAmount: minAmount || "",
      maxAmount: maxAmount || "",
      status,
    });
    setCurrentPage(0);
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const minAmount = appliedFilters.minAmount.trim() !== "" ? Number(appliedFilters.minAmount) : undefined;
      const maxAmount = appliedFilters.maxAmount.trim() !== "" ? Number(appliedFilters.maxAmount) : undefined;

      const response = await apiClient.pawnTransactions.searchAdvanced({
        customerNic: appliedFilters.customerNic.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
        maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
        patternMode: categoryFilter === "A" ? "A" : undefined,
        page: 0,
        size: Math.max(totalElements, 1) || 100000,
        sortBy: "pawnDate",
        sortDir: "desc",
      });

      const allTransactions: Transaction[] = response.content || [];
      const activeTransactions = allTransactions.filter((t) => t.status === "Active");
      const balances: Record<string, OutstandingBalance> = {};
      const balanceResults = await Promise.allSettled(
        activeTransactions.map((transaction) => apiClient.pawnRedemptions.getOutstandingBalance(transaction.id))
      );
      balanceResults.forEach((result, index) => {
        const transaction = activeTransactions[index];
        if (result.status === "fulfilled") {
          balances[transaction.id] = result.value;
        } else {
          console.error(`Failed to fetch balance for transaction ${transaction.id}:`, result.reason);
          balances[transaction.id] = { total: transaction.remainingBalance || transaction.loanAmount };
        }
      });

      const headers = ["Receipt No", "Customer", "NIC", "Loan Amount", "Remaining Balance", "Rate %", "Maturity", "Status"];
      const rows = allTransactions.map((t) => [
        t.pawnId || t.pawn_id,
        t.customerName || t.customer_name,
        t.customerNic || t.customer_nic,
        Number(t.loanAmount || t.loan_amount),
        rowRemainingBalanceText(t, balances),
        t.interestRatePercent || t.interest_rate_percent,
        t.maturityDate || t.maturity_date,
        rowStatusText(t),
      ]);

      const csvContent = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify({ title: "Success", description: `Exported ${allTransactions.length} transaction(s) to CSV`, variant: "success" });
    } catch (error) {
      console.error("Failed to export transactions:", error);
      notify({ title: "Error", description: "Failed to export transactions to CSV", variant: "destructive" });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const columns: DataTableColumn<Transaction>[] = [
    { key: "pawnId", header: "Receipt No", className: "font-monospace fw-semibold", render: (t) => t.pawnId || t.pawn_id },
    { key: "customerName", header: "Customer", render: (t) => t.customerName || t.customer_name },
    { key: "customerNic", header: "NIC", render: (t) => t.customerNic || t.customer_nic },
    { key: "loanAmount", header: "Loan Amount", render: (t) => `Rs. ${Number(t.loanAmount || t.loan_amount).toLocaleString()}` },
    {
      key: "remainingBalance",
      header: "Remaining Balance",
      render: (t) => {
        if (t.status === "Active" && outstandingBalances[t.id]) {
          return <span className="text-warning fw-semibold">Rs. {outstandingBalances[t.id].total?.toLocaleString() || 0}</span>;
        }
        if (t.status === "Active" && t.remainingBalance) {
          return <span className="text-warning fw-semibold">Rs. {Number(t.remainingBalance).toLocaleString()}</span>;
        }
        if (t.status === "Completed") return <span className="text-success fw-semibold">Settled</span>;
        if (t.status === "Profited") return <span className="text-warning fw-semibold">Forfeited</span>;
        return <span className="text-muted">-</span>;
      },
    },
    { key: "interestRatePercent", header: "Rate %", render: (t) => `${t.interestRatePercent || t.interest_rate_percent}%` },
    { key: "maturityDate", header: "Maturity", render: (t) => t.maturityDate || t.maturity_date },
    {
      key: "status",
      header: "Status",
      render: (t) => {
        const overdue = isRowOverdue(t) || t.status === "Overdue";
        const status = overdue ? "Overdue" : t.status;
        return <Badge color={overdue ? "danger" : STATUS_COLOR[t.status] ?? "secondary"}>{STATUS_LABEL[status] ?? status}</Badge>;
      },
    },
    ...(has("tickets.view.detail")
      ? [
          {
            key: "actions",
            header: "Actions",
            align: "end" as const,
            render: (t: Transaction) => (
              <div className="d-flex flex-wrap gap-1 justify-content-end">
                <Button color="dark" isLight onClick={() => navigate(`/transactions/info/${t.id}`)} isDisable={loading}>
                  Info
                </Button>
                {t.status !== "Completed" && t.status !== BLACKLISTED_STATUS && t.status !== "Profited" && (
                  <Button color="dark" isLight onClick={() => navigate(`/transactions/edit/${t.id}`)} isDisable={loading}>
                    Edit
                  </Button>
                )}
                {t.status === "Active" && has("redemption.view.balance") && (
                  <Button color="info" isLight onClick={() => navigate(`/transactions/redeem/${t.id}`)} isDisable={loading}>
                    Redeem
                  </Button>
                )}
                {t.status === "Active" && has("profit.record") && (
                  <Button color="warning" isLight onClick={() => navigate(`/transactions/profit/${t.id}`)} isDisable={loading}>
                    Forfeited
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageWrapper title="Pawn Transactions">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Pawn Transactions", to: "/transactions" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="dark" isLight icon="Download" onClick={handleDownloadCsv} isDisable={downloadingCsv} className="me-2">
            {downloadingCsv ? "Exporting..." : "Download CSV"}
          </Button>
          {has("tickets.create.inline") && branchId && (
            <Button color="primary" onClick={() => navigate("/transactions/create")}>
              Create Pawning
            </Button>
          )}
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title="Transaction Search"
            subtitle="Search pawn transactions by Receipt No, NIC, amount, or status"
            inputFields={[
              { name: "pawnId", label: "Receipt No", placeholder: "Enter Receipt No", inline: true },
              { name: "customerNic", label: "Customer NIC", placeholder: "Enter NIC number", inline: true },
              { name: "minAmount", label: "Min Amount", placeholder: "Min loan amount", type: "number", inline: true },
              { name: "maxAmount", label: "Max Amount", placeholder: "Max loan amount", type: "number", inline: true },
            ]}
            checkboxGroups={[
              {
                name: "status",
                label: "Status",
                options: [
                  { label: "Current", value: "Active" },
                  { label: "Outstanding", value: "Overdue" },
                  { label: "Redemption", value: "Completed" },
                  { label: "Forfeited", value: "Defaulted" },
                  { label: "Black Listed", value: "Blocked" },
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
            <DataTable columns={columns} data={transactions} keyField={(t) => t.id} isLoading={loading} emptyMessage="No transactions found" />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="transactions"
          />
        </Card>
      </Page>

      {/* Create Transaction */}
      <FormModal
        isOpen={showCreate}
        setIsOpen={setShowCreate}
        title="New Pawn Transaction"
        onSubmit={handleCreate}
        isSubmitting={loading}
        submitLabel="Create Transaction"
        size="lg"
      >
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <FormGroup id="txCustomerName" label="Customer Name" isFloating>
              <Input value={customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)} required />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txCustomerNic" label="NIC" isFloating>
              <Input value={customerNic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerNic(e.target.value)} required />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txCustomerAddress" label="Address" isFloating>
              <Input value={customerAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerAddress(e.target.value)} required />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txCustomerPhone" label="Phone" isFloating>
              <Input value={customerPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)} />
            </FormGroup>
          </div>
        </div>

        <hr />

        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <FormGroup id="txItemType" label="Item Type *" formText="Select the type of gold item being pawned">
              <Select ariaLabel="Item Type" value={selectedItemTypeId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedItemTypeId(e.target.value)} required placeholder="Select item type">
                {itemTypes.length > 0 ? (
                  itemTypes.map((type) => (
                    <Option key={type.id} value={type.id}>{`${type.name}${type.description ? ` - ${type.description}` : ""}`}</Option>
                  ))
                ) : (
                  <Option value="" disabled>No item types available</Option>
                )}
              </Select>
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txItemDescription" label="Additional Details (Optional)" formText="Add specific details about this item">
              <Input value={itemDescription} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemDescription(e.target.value)} placeholder="e.g., With stones, 18 inch length" />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txItemWeight" label="Weight (grams) *">
              <NumberInput value={itemWeight} onChange={setItemWeight} precision={3} required />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txItemKarat" label="Karat *">
              <Select ariaLabel="Karat" value={itemKarat} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemKarat(e.target.value)}>
                {[24, 22, 21, 18, 14].map((k) => <Option key={k} value={String(k)}>{`${k}K`}</Option>)}
              </Select>
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txAppraisedValue" label="Appraised Value *" isFloating>
              <Input type="number" step={0.01} value={appraisedValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppraisedValue(e.target.value)} required />
            </FormGroup>
          </div>
        </div>

        <hr />

        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <FormGroup id="txLoanAmount" label="Loan Amount" isFloating>
              <Input type="number" step={0.01} value={loanAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoanAmount(e.target.value)} required />
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txInterestRate" label="Interest Rate">
              <Select ariaLabel="Interest Rate" value={selectedRateId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRateId(e.target.value)} placeholder="Select rate">
                {rates.map((r) => <Option key={r.id} value={r.id}>{`${r.name} - ${r.rate_percent}%`}</Option>)}
              </Select>
            </FormGroup>
          </div>
          <div className="col-12 col-sm-6">
            <FormGroup id="txPeriodMonths" label="Period (months)">
              <Select ariaLabel="Period" value={periodMonths} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriodMonths(e.target.value)}>
                {[3, 6, 9, 12, 18, 24].map((m) => <Option key={m} value={String(m)}>{`${m} months`}</Option>)}
              </Select>
            </FormGroup>
          </div>
        </div>

        <FormGroup id="txRemarks" label="Remarks" isFloating>
          <Textarea value={remarks} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)} />
        </FormGroup>

        <div className="border-top pt-3">
          <label className="form-label d-flex align-items-center gap-2">Item Images (Optional)</label>
          <p className="text-muted small mb-2">Upload images of the gold item from different angles</p>
          <div className="d-flex align-items-center gap-2 mb-3">
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImages} className="form-control" />
            <span className="text-muted small text-nowrap">{uploadedImages.length} selected</span>
          </div>
          {imagePreviews.length > 0 && (
            <div className="row g-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="col-4 position-relative">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-100 rounded border" style={{ height: 96, objectFit: "cover" }} />
                  <Button color="danger" size="sm" className="position-absolute top-0 end-0 m-1" onClick={() => removeImage(index)} icon="Close" aria-label="Remove image" />
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>
    </PageWrapper>
  );
}
