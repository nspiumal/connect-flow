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
import { TColor } from "@/vendor/facit/type/color-type";

interface Rate { id: string; name: string; rate_percent?: number; ratePercent?: number }
interface ItemType { id: string; name: string; description?: string }
interface OutstandingBalance {
  total?: number;
  principal?: number;
  accrualInterest?: number;
  charges?: number;
  ratePercent?: number;
  pawnDate?: string;
  maturityDate?: string;
  loanStatus?: string;
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

const STATUS_LABEL: Record<string, string> = {
  Active: "Current",
  Overdue: "Outstanding",
  Completed: "Redemption",
  Profited: "Forfeited",
  Blocked: "Black Listed",
};

const STATUS_COLOR: Record<string, TColor> = {
  Active: "primary",
  Completed: "secondary",
  Profited: "warning",
  Overdue: "danger",
  Blocked: "danger",
};

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
  const [rates, setRates] = useState<Rate[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<Record<string, OutstandingBalance>>({});

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
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

  // Redemption state
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<OutstandingBalance | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [documentationAmount, setDocumentationAmount] = useState("0");
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
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
        for (const transaction of activeTransactions) {
          try {
            balances[transaction.id] = await apiClient.pawnRedemptions.getOutstandingBalance(transaction.id);
          } catch (error) {
            console.error(`Failed to fetch balance for transaction ${transaction.id}:`, error);
            balances[transaction.id] = {
              total: transaction.remainingBalance || transaction.loanAmount,
              principal: transaction.remainingBalance || transaction.loanAmount,
              accrualInterest: 0,
              charges: 0,
            };
          }
        }
        setOutstandingBalances(balances);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      notify({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const data = await apiClient.itemTypes.getAll();
      setItemTypes(data || []);
    } catch (error) {
      console.error("Failed to fetch item types:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try { await fetchTransactions(); } catch (error) { console.error("Error loading transactions:", error); }
      try { await fetchRates(); } catch (error) { console.error("Error loading rates:", error); }
      try { await fetchItemTypes(); } catch (error) { console.error("Error loading item types:", error); }
    };
    loadData();
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

  const fetchOutstandingBalance = async (transactionId: string) => {
    try {
      setBalanceLoading(true);
      const balance = await apiClient.pawnRedemptions.getOutstandingBalance(transactionId);
      setOutstandingBalance(balance);
      setRedemptionAmount("");
      setRedemptionNotes("");
      setDocumentationAmount("0");
    } catch (error) {
      console.error("Failed to fetch outstanding balance:", error);
      notify({ title: "Error", description: "Failed to load outstanding balance", variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleOpenRedemption = async (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowRedemptionDialog(true);
    await fetchOutstandingBalance(transactionId);
  };

  const handleRedeemTransaction = async () => {
    if (!selectedTransactionId) return;

    if (!redemptionAmount || parseFloat(redemptionAmount) <= 0) {
      notify({ title: "Validation Error", description: "Please enter a valid redemption amount", variant: "destructive" });
      return;
    }

    try {
      setRedemptionLoading(true);
      const result = await apiClient.pawnRedemptions.processRedemption(selectedTransactionId, {
        redemptionAmount: parseFloat(redemptionAmount),
        notes: redemptionNotes,
        charges: effectiveCharges,
      });

      if (result.isFullRedemption) {
        notify({
          title: "✓ Full Redemption Completed!",
          description: `Transaction marked as CLOSED. Gold will be released. Interest: Rs. ${result.interestPaid?.toLocaleString() || 0} · Charges: Rs. ${result.chargesPaid?.toLocaleString() || 0} · Principal: Rs. ${result.principalPaid?.toLocaleString() || 0}`,
          variant: "success",
        });
      } else {
        notify({
          title: "✓ Partial Payment Recorded!",
          description: `Total Paid: Rs. ${parseFloat(redemptionAmount).toLocaleString()} · Interest: Rs. ${result.interestPaid?.toLocaleString() || 0} · Charges: Rs. ${result.chargesPaid?.toLocaleString() || 0} · Principal: Rs. ${result.principalPaid?.toLocaleString() || 0} · Remaining Principal: Rs. ${result.remainingPrincipal?.toLocaleString() || 0}`,
          variant: "success",
        });
      }

      setShowRedemptionDialog(false);
      setSelectedTransactionId(null);
      setRedemptionAmount("");
      setRedemptionNotes("");
      setOutstandingBalance(null);

      await fetchTransactions();
    } catch (error) {
      console.error("Failed to process redemption:", error);
      const message = error instanceof Error ? error.message : "Failed to process redemption";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRedemptionLoading(false);
    }
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
      for (const transaction of activeTransactions) {
        try {
          balances[transaction.id] = await apiClient.pawnRedemptions.getOutstandingBalance(transaction.id);
        } catch (error) {
          console.error(`Failed to fetch balance for transaction ${transaction.id}:`, error);
          balances[transaction.id] = { total: transaction.remainingBalance || transaction.loanAmount };
        }
      }

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

  const fixedCharges = 50;
  const documentationValue = Number(documentationAmount) || 0;
  const effectiveCharges = fixedCharges + documentationValue;
  const computedOutstandingTotal =
    (Number(outstandingBalance?.principal) || 0) + (Number(outstandingBalance?.accrualInterest) || 0) + effectiveCharges;

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
                {t.status !== "Completed" && t.status !== "Blocked" && t.status !== "Profited" && (
                  <Button color="dark" isLight onClick={() => navigate(`/transactions/edit/${t.id}`)} isDisable={loading}>
                    Edit
                  </Button>
                )}
                {t.status === "Active" && has("redemption.view.balance") && (
                  <Button color="info" isLight onClick={() => handleOpenRedemption(t.id)} isDisable={loading}>
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

      {/* Redemption */}
      <FormModal
        isOpen={showRedemptionDialog}
        setIsOpen={setShowRedemptionDialog}
        title="Process Gold Redemption"
        onSubmit={handleRedeemTransaction}
        isSubmitting={redemptionLoading}
        submitLabel="Confirm Redemption"
        size="lg"
      >
        {balanceLoading ? (
          <p className="text-muted text-center py-4 mb-0">Loading balance details...</p>
        ) : outstandingBalance ? (
          <>
            <div className="bg-l10-info p-3 rounded border">
              <h3 className="fs-6 fw-semibold mb-3">Transaction Summary</h3>
              <div className="row g-3 small">
                <div className="col-6">
                  <p className="text-muted mb-0">Loan Amount</p>
                  <p className="fw-semibold mb-0">Rs. {outstandingBalance.principal?.toLocaleString() || 0}</p>
                </div>
                <div className="col-6">
                  <p className="text-muted mb-0">Interest Rate</p>
                  <p className="fw-semibold mb-0">{outstandingBalance.ratePercent || "N/A"}%</p>
                </div>
                <div className="col-6">
                  <p className="text-muted mb-0">Pawn Date (Created)</p>
                  <p className="fw-semibold mb-0">{outstandingBalance.pawnDate || "N/A"}</p>
                </div>
                <div className="col-6">
                  <p className="text-muted mb-0">Maturity Date</p>
                  <p className="fw-semibold mb-0">{outstandingBalance.maturityDate || "N/A"}</p>
                </div>
                <div className="col-6">
                  <p className="text-muted mb-0">Status</p>
                  <p className="fw-semibold mb-0">{outstandingBalance.loanStatus || "Active"}</p>
                </div>
              </div>
            </div>

            <div className="bg-body-tertiary p-3 rounded border mt-3">
              <h3 className="fs-6 fw-semibold mb-3">Outstanding Balance Breakdown</h3>
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Principal:</span>
                <span className="fw-medium">Rs. {outstandingBalance.principal?.toLocaleString() || 0}</span>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Accrued Interest:</span>
                <span className="fw-medium">Rs. {outstandingBalance.accrualInterest?.toLocaleString() || 0}</span>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Charges:</span>
                <span className="fw-medium">Rs. {fixedCharges.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center small mb-2">
                <span className="text-muted">Documentation:</span>
                <div style={{ width: 120 }}>
                  <NumberInput value={documentationAmount} onChange={setDocumentationAmount} placeholder="0" />
                </div>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total Outstanding:</span>
                <span>Rs. {computedOutstandingTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3">
              <FormGroup id="txRedemptionAmount" label="Redemption Amount *">
                <NumberInput value={redemptionAmount} onChange={setRedemptionAmount} placeholder="Enter amount to pay" required />
              </FormGroup>

              <div className="p-3 bg-body-tertiary rounded border small mb-2">
                <p className="fw-semibold mb-1">Payment Allocation:</p>
                <p className="mb-1">Interest → Charges → Principal</p>
                <p className="text-muted small mb-0">Interest is calculated weekly (Mon-Sun). Paying any day counts the full week.</p>
              </div>

              {redemptionAmount && computedOutstandingTotal ? (
                <div className="p-2 bg-body-tertiary rounded small mb-2">
                  {parseFloat(redemptionAmount) === computedOutstandingTotal ? (
                    <p className="text-success fw-semibold mb-0">✓ Full Redemption (Complete Settlement)</p>
                  ) : parseFloat(redemptionAmount) < computedOutstandingTotal ? (
                    <p className="text-info mb-0">
                      Partial Payment - Remaining Principal: Rs.{" "}
                      {(Number(outstandingBalance.principal || 0) - (parseFloat(redemptionAmount) - Number(outstandingBalance.accrualInterest || 0) - effectiveCharges)).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-danger mb-0">⚠ Amount exceeds outstanding balance</p>
                  )}
                </div>
              ) : null}

              <FormGroup id="txRedemptionNotes" label="Notes (Optional)">
                <Textarea value={redemptionNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRedemptionNotes(e.target.value)} placeholder="Add any notes about this redemption" rows={3} />
              </FormGroup>
            </div>
          </>
        ) : (
          <p className="text-danger text-center py-4 mb-0">Failed to load balance details</p>
        )}
      </FormModal>
    </PageWrapper>
  );
}
