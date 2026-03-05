import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Edit, X, Image as ImageIcon, ChevronLeft, ChevronRight, Info, DollarSign } from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Transactions() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterPawnId, setFilterPawnId] = useState("");
  const [filterNic, setFilterNic] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    pawnId: "",
    customerNic: "",
    minAmount: "",
    maxAmount: "",
    status: "all",
  });
  const [rates, setRates] = useState<any[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<{ [key: string]: any }>({});

  // Category filter state (default to "A" only)
  const [categoryFilter, setCategoryFilter] = useState<"A" | "ALL">("A");
  const [patternUnlocked, setPatternUnlocked] = useState(false);
  const [patternBuffer, setPatternBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { toast } = useToast();
  const { role } = useAuth();
  const navigate = useNavigate();

  // Mock branchId - in real app this would come from user context
  const branchId = "mock-branch-id";

  // Form state
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
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Redemption state
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<any>(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const minAmount = appliedFilters.minAmount.trim() !== ""
        ? Number(appliedFilters.minAmount)
        : undefined;
      const maxAmount = appliedFilters.maxAmount.trim() !== ""
        ? Number(appliedFilters.maxAmount)
        : undefined;

      const response = await apiClient.pawnTransactions.searchAdvanced({
        pawnId: appliedFilters.pawnId.trim() || undefined,
        customerNic: appliedFilters.customerNic.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
        maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
        patternMode: categoryFilter === "A" ? "A" : undefined, // Filter by pattern mode
        page: currentPage,
        size: pageSize,
        sortBy: "pawnDate",
        sortDir: "desc",
      });
      console.log("Fetched transactions:", response);
      setTransactions(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);

      // Fetch outstanding balances (including accrued interest) for all active transactions
      const activeTransactions = response.content?.filter((t: any) => t.status === "Active") || [];
      if (activeTransactions.length > 0) {
        const balances: { [key: string]: any } = {};
        for (const transaction of activeTransactions) {
          try {
            const balance = await apiClient.pawnRedemptions.getOutstandingBalance(transaction.id);
            balances[transaction.id] = balance;
          } catch (error) {
            console.error(`Failed to fetch balance for transaction ${transaction.id}:`, error);
            // Fallback to DB remaining balance
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
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    }
  };

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      console.log("Fetched rates:", data);
      setRates(data || []);
    } catch (error: any) {
      console.error("Failed to fetch rates:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTransactions();
      } catch (error) {
        console.error("Error loading transactions:", error);
      }

      try {
        await fetchRates();
      } catch (error) {
        console.error("Error loading rates:", error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters, categoryFilter]);

  // TND Pattern detection for unlocking category B
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      const currentTime = Date.now();
      const key = e.key.toUpperCase();

      // If more than 2 seconds since last key, reset buffer
      if (currentTime - lastKeyTime > 2000) {
        setPatternBuffer(key);
      } else {
        setPatternBuffer((prev) => prev + key);
      }
      setLastKeyTime(currentTime);

      // Check if buffer matches TND pattern
      const newBuffer = currentTime - lastKeyTime > 2000 ? key : patternBuffer + key;
      if (newBuffer.length >= 3) {
        const lastThree = newBuffer.slice(-3);
        if (lastThree === "TND" && !patternUnlocked) {
          setPatternUnlocked(true);
          setCategoryFilter("ALL");
          setPatternBuffer("");
          toast({
            title: "🔓 All Categories Unlocked",
            description: "Search will now include both A and B categories",
          });
          // Refresh transactions with new filter
          fetchTransactions();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [lastKeyTime, patternBuffer, patternUnlocked, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!customerName || !customerNic || !customerAddress || !itemDescription || !loanAmount || !selectedRateId || !periodMonths) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get the interest rate percent from selected rate
      const selectedRate = rates.find(r => r.id === selectedRateId);
      if (!selectedRate) {
        toast({
          title: "Error",
          description: "Please select a valid interest rate",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate dates
      const today = new Date();
      const pawnDate = today.toISOString().split('T')[0]; // Today's date

      // Calculate maturity date (today + period months)
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths));
      const maturityDateStr = maturityDate.toISOString().split('T')[0];

      // Prepare transaction data
      const transactionData = {
        customerName,
        customerNic,
        idType,
        gender,
        customerAddress,
        customerPhone,
        customerType: "Regular", // Default customer type
        patternMode: categoryFilter, // Store pattern mode (A or ALL)
        itemDescription,
        itemContent,
        itemCondition,
        itemWeightGrams: itemWeight ? parseFloat(itemWeight) : 0,
        itemKarat: parseInt(itemKarat),
        appraisedValue: appraisedValue ? parseFloat(appraisedValue) : 0,
        loanAmount: parseFloat(loanAmount),
        interestRateId: selectedRateId,
        interestRatePercent: selectedRate.rate_percent || selectedRate.ratePercent, // Get percent from selected rate
        periodMonths: parseInt(periodMonths),
        pawnDate, // Today's date
        maturityDate: maturityDateStr, // Calculated maturity date
        remarks,
        imageUrls: imagePreviews, // Base64 encoded images
      };

      // Call API to create transaction
      const response = await apiClient.pawnTransactions.create(transactionData);

      toast({
        title: "Success",
        description: `Transaction created successfully! Pawn ID: ${response.pawnId || response.pawn_id}`,
      });

      // Reset form
      setCustomerName("");
      setCustomerNic("");
      setIdType("NIC");
      setGender("");
      setCustomerAddress("");
      setCustomerPhone("");
      setItemDescription("");
      setItemContent("");
      setItemCondition("Good");
      setItemWeight("");
      setItemKarat("24");
      setAppraisedValue("");
      setLoanAmount("");
      setSelectedRateId("");
      setPeriodMonths("6");
      setRemarks("");
      setUploadedImages([]);
      setImagePreviews([]);

      // Close dialog and refresh transactions
      setShowCreate(false);
      fetchTransactions();
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);

      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Store files for later upload
      setUploadedImages((prev) => [...prev, ...files]);

      toast({
        title: "Images selected",
        description: `${files.length} image(s) selected. They will be uploaded when you create the transaction.`,
      });
    } catch (error: any) {
      console.error("Error processing images:", error);
      toast({
        title: "Error",
        description: "Failed to process images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenRedemption = async (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowRedemptionDialog(true);
    await fetchOutstandingBalance(transactionId);
  };

  const fetchOutstandingBalance = async (transactionId: string) => {
    try {
      setBalanceLoading(true);
      const balance = await apiClient.pawnRedemptions.getOutstandingBalance(transactionId);
      setOutstandingBalance(balance);
      setRedemptionAmount("");
      setRedemptionNotes("");
    } catch (error: any) {
      console.error("Failed to fetch outstanding balance:", error);
      toast({
        title: "Error",
        description: "Failed to load outstanding balance",
        variant: "destructive",
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleRedeemTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransactionId) return;

    if (!redemptionAmount || parseFloat(redemptionAmount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid redemption amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setRedemptionLoading(true);
      const redemptionData = {
        redemptionAmount: parseFloat(redemptionAmount),
        notes: redemptionNotes,
      };

      const result = await apiClient.pawnRedemptions.processRedemption(selectedTransactionId, redemptionData);

      // Show detailed success message based on redemption type
      if (result.isFullRedemption) {
        toast({
          title: "✓ Full Redemption Completed!",
          description: `Transaction marked as CLOSED. Gold will be released.\n\nPayment Breakdown:\n• Interest: Rs. ${result.interestPaid?.toLocaleString() || 0}\n• Charges: Rs. ${result.chargesPaid?.toLocaleString() || 0}\n• Principal: Rs. ${result.principalPaid?.toLocaleString() || 0}`,
        });
      } else {
        toast({
          title: "✓ Partial Payment Recorded!",
          description: `Total Paid: Rs. ${parseFloat(redemptionAmount).toLocaleString()}\n\nPayment Breakdown:\n• Interest: Rs. ${result.interestPaid?.toLocaleString() || 0}\n• Charges: Rs. ${result.chargesPaid?.toLocaleString() || 0}\n• Principal: Rs. ${result.principalPaid?.toLocaleString() || 0}\n\nRemaining Principal: Rs. ${result.remainingPrincipal?.toLocaleString() || 0}`,
        });
      }

      // Close dialog
      setShowRedemptionDialog(false);
      setSelectedTransactionId(null);
      setRedemptionAmount("");
      setRedemptionNotes("");
      setOutstandingBalance(null);

      // Refresh transactions - remainingBalance will be updated from DB
      await fetchTransactions();
    } catch (error: any) {
      console.error("Failed to process redemption:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process redemption",
        variant: "destructive",
      });
    } finally {
      setRedemptionLoading(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "Active") return "default";
    if (s === "Completed") return "secondary";
    return "destructive";
  };

  const applySearch = () => {
    setAppliedFilters({
      pawnId: filterPawnId,
      customerNic: filterNic,
      minAmount: filterMinAmount,
      maxAmount: filterMaxAmount,
      status: statusFilter,
    });
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading transactions..." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pawn Transactions</h1>
        <div className="flex gap-2">
          {(role !== "STAFF" || role === "STAFF") && branchId && (
            <Button onClick={() => navigate("/transactions/create")} variant="default">
              <Plus className="mr-2 h-4 w-4" /> Create Pawning
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Pawn ID"
            value={filterPawnId}
            onChange={(e) => setFilterPawnId(e.target.value)}
            className="pl-3"
          />
        </div>
        <div className="relative flex-1">
          <Input
            placeholder="NIC"
            value={filterNic}
            onChange={(e) => setFilterNic(e.target.value)}
            className="pl-3"
          />
        </div>
        <div className="relative w-36">
          <Input
            type="number"
            min="0"
            placeholder="Min Amount"
            value={filterMinAmount}
            onChange={(e) => setFilterMinAmount(e.target.value)}
            className="pl-3"
          />
        </div>
        <div className="relative w-36">
          <Input
            type="number"
            min="0"
            placeholder="Max Amount"
            value={filterMaxAmount}
            onChange={(e) => setFilterMaxAmount(e.target.value)}
            className="pl-3"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Defaulted">Defaulted</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={applySearch}>
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pawn ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Rate %</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead>Status</TableHead>
                  {(role === "MANAGER" || role === "SUPERADMIN" || role === "ADMIN" || role === "STAFF") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">{t.pawnId || t.pawn_id}</TableCell>
                    <TableCell>{t.customerName || t.customer_name}</TableCell>
                    <TableCell>{t.customerNic || t.customer_nic}</TableCell>
                    <TableCell>Rs. {Number(t.loanAmount || t.loan_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {t.status === "Active" && outstandingBalances[t.id] ? (
                        <span className="text-orange-600 font-semibold">
                          Rs. {outstandingBalances[t.id].total?.toLocaleString() || 0}
                        </span>
                      ) : t.status === "Active" && t.remainingBalance ? (
                        <span className="text-orange-600 font-semibold">Rs. {Number(t.remainingBalance).toLocaleString()}</span>
                      ) : t.status === "Completed" ? (
                        <span className="text-green-600 font-semibold">Settled</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>{t.interestRatePercent || t.interest_rate_percent}%</TableCell>
                    <TableCell>{t.maturityDate || t.maturity_date}</TableCell>
                    <TableCell>
                      {(() => {
                        const maturityDate = t.maturityDate || t.maturity_date;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maturity = maturityDate ? new Date(maturityDate) : null;
                        if (maturity) maturity.setHours(0, 0, 0, 0);

                        // Check if overdue (Active status but past maturity)
                        const isOverdue = t.status === "Active" && maturity && maturity < today;

                        if (isOverdue || t.status === "Overdue") {
                          return <Badge variant="destructive">Overdue</Badge>;
                        }

                        return (
                          <Badge variant={
                            t.status === "Active" ? "default" :
                            t.status === "Completed" ? "secondary" :
                            "destructive"
                          }>
                            {t.status}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    {(role === "MANAGER" || role === "SUPERADMIN" || role === "ADMIN" || role === "STAFF") && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/transactions/info/${t.id}`)}
                            disabled={loading}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Info
                          </Button>
                          {t.status !== "Completed" && t.status !== "Blocked" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/transactions/edit/${t.id}`)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {t.status === "Active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRedemption(t.id)}
                              disabled={loading}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Redeem
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
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
                Showing {transactions.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} transactions
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
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
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Pawn Transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Customer Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div>
              <div><Label>NIC</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required /></div>
              <div><Label>Address</Label><Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required /></div>
              <div><Label>Phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Item Description</Label><Input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required /></div>
              <div><Label>Weight (grams)</Label><Input type="number" step="0.01" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} required /></div>
              <div><Label>Karat</Label>
                <Select value={itemKarat} onValueChange={setItemKarat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[24,22,21,18,14].map((k) => <SelectItem key={k} value={String(k)}>{k}K</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Appraised Value</Label><Input type="number" step="0.01" value={appraisedValue} onChange={(e) => setAppraisedValue(e.target.value)} required /></div>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Loan Amount</Label><Input type="number" step="0.01" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} required /></div>
              <div><Label>Interest Rate</Label>
                <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                  <SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger>
                  <SelectContent>
                    {rates.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} - {r.rate_percent}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Period (months)</Label>
                <Select value={periodMonths} onValueChange={setPeriodMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[3,6,9,12,18,24].map((m) => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>

            {/* Image Upload Section */}
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Item Images (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">Upload images of the gold item from different angles</p>

              <div className="flex gap-2 mb-3">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground py-2">{uploadedImages.length} image(s) selected</span>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create Transaction"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Process Gold Redemption</DialogTitle></DialogHeader>

          {balanceLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading balance details...</div>
          ) : outstandingBalance ? (
            <form onSubmit={handleRedeemTransaction} className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Transaction Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Loan Amount</p>
                    <p className="font-semibold">Rs. {outstandingBalance.principal?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-semibold">{outstandingBalance.ratePercent || "N/A"}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pawn Date (Created)</p>
                    <p className="font-semibold">{outstandingBalance.pawnDate || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Maturity Date</p>
                    <p className="font-semibold">{outstandingBalance.maturityDate || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold">{outstandingBalance.loanStatus || "Active"}</p>
                  </div>
                </div>
              </div>

              {/* Outstanding Balance Breakdown */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-3">Outstanding Balance Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-medium">Rs. {outstandingBalance.principal?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accrued Interest:</span>
                    <span className="font-medium">Rs. {outstandingBalance.accrualInterest?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Charges:</span>
                    <span className="font-medium">Rs. {outstandingBalance.charges?.toLocaleString() || 0}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-base font-bold text-amber-900">
                    <span>Total Outstanding:</span>
                    <span>Rs. {outstandingBalance.total?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              {/* Redemption Input */}
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Redemption Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(e.target.value)}
                    placeholder="Enter amount to pay"
                    required
                  />

                  {/* Payment Allocation Information */}
                  <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200 text-sm">
                    <p className="font-semibold text-yellow-900 mb-1">Payment Allocation:</p>
                    <p className="text-yellow-800">Interest → Charges → Principal</p>
                    <p className="text-yellow-700 mt-1 text-xs">Interest is calculated weekly (Mon-Sun). Paying any day counts the full week.</p>
                  </div>

                  {redemptionAmount && outstandingBalance?.total && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                      {parseFloat(redemptionAmount) === outstandingBalance.total ? (
                        <p className="text-green-700 font-semibold">✓ Full Redemption (Complete Settlement)</p>
                      ) : parseFloat(redemptionAmount) < outstandingBalance.total ? (
                        <p className="text-blue-700">
                          Partial Payment - Remaining Principal: Rs. {(Number(outstandingBalance.principal || 0) - (parseFloat(redemptionAmount) - Number(outstandingBalance.accrualInterest || 0) - Number(outstandingBalance.charges || 0))).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-red-700">⚠ Amount exceeds outstanding balance</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={redemptionNotes}
                    onChange={(e) => setRedemptionNotes(e.target.value)}
                    placeholder="Add any notes about this redemption"
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={redemptionLoading || !redemptionAmount}>
                {redemptionLoading ? "Processing..." : "Confirm Redemption"}
              </Button>
            </form>
          ) : (
            <div className="py-8 text-center text-red-500">Failed to load balance details</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
