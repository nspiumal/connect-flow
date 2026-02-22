import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, ArrowLeft } from "lucide-react";

export default function TransactionEdit() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, role, branchId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [rates, setRates] = useState<Array<{id: string; name: string; rate_percent: number; ratePercent?: number}>>([]);

  interface ItemDetail {
    description: string;
    content: string;
    condition: string;
    weightGrams: number;
    karat: number;
    appraisedValue: number;
    images: string[];
  }

  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [idType, setIdType] = useState("NIC");
  const [gender, setGender] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [originalCustomerAddress, setOriginalCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [items, setItems] = useState<ItemDetail[]>([]);

  const [loanAmount, setLoanAmount] = useState("");
  const [originalLoanAmount, setOriginalLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [originalRateId, setOriginalRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [originalPeriodMonths, setOriginalPeriodMonths] = useState("6");
  const [status, setStatus] = useState("Active");
  const [originalStatus, setOriginalStatus] = useState("Active");
  const [remarks, setRemarks] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [policeReportDate, setPoliceReportDate] = useState("");

  const [pawnId, setPawnId] = useState("");
  const [pawnDate, setPawnDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [originalMaturityDate, setOriginalMaturityDate] = useState("");

  const [imageBlobUrls, setImageBlobUrls] = useState<{[key: string]: string}>({});

  const [pinInput, setPinInput] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [managerUserId, setManagerUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
    if (id) {
      fetchTransaction();
    } else {
      setTransactionLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoadingData(ratesLoading || transactionLoading);
  }, [ratesLoading, transactionLoading]);

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      toast({
        title: "Error",
        description: "Failed to load interest rates",
        variant: "destructive",
      });
    } finally {
      setRatesLoading(false);
    }
  };

  const fetchTransaction = async () => {
    try {
      setTransactionLoading(true);
      const response = await apiClient.pawnTransactions.getById(id!);

      setCustomerName(response.customerName || "");
      setCustomerNic(response.customerNic || "");
      setIdType(response.idType || "NIC");
      setGender(response.gender || "");
      setCustomerAddress(response.customerAddress || "");
      setOriginalCustomerAddress(response.customerAddress || "");
      setCustomerPhone(response.customerPhone || "");

      setLoanAmount(response.loanAmount ? String(response.loanAmount) : "");
      setOriginalLoanAmount(response.loanAmount ? String(response.loanAmount) : "");
      setSelectedRateId(response.interestRateId || "");
      setOriginalRateId(response.interestRateId || "");
      setPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setOriginalPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setStatus(response.status || "Active");
      setOriginalStatus(response.status || "Active");
      setRemarks(response.remarks || "");
      setBlockReason(response.blockReason || "");

      setPawnId(response.pawnId || "");
      setPawnDate(response.pawnDate || "");
      setMaturityDate(response.maturityDate || "");
      setOriginalMaturityDate(response.maturityDate || "");

      if (response.itemDetails && Array.isArray(response.itemDetails) && response.itemDetails.length > 0) {
        const itemsWithImages = response.itemDetails.map((item: ItemDetail & {itemDescription?: string; itemContent?: string; itemCondition?: string; itemWeightGrams?: number; itemKarat?: number; imageUrls?: string[]; images?: string[]}) => ({
          description: item.itemDescription || item.description || "",
          content: item.itemContent || item.content || "",
          condition: item.itemCondition || item.condition || "Good",
          weightGrams: item.itemWeightGrams || item.weightGrams || 0,
          karat: item.itemKarat || item.karat || 24,
          appraisedValue: item.appraisedValue || 0,
          images: item.imageUrls || item.images || [],
        }));
        setItems(itemsWithImages);

        itemsWithImages.forEach((item, itemIndex) => {
          if (item.images && Array.isArray(item.images)) {
            item.images.forEach((imageUrl: string, imageIndex: number) => {
              loadImageWithAuth(imageUrl, `${itemIndex}-${imageIndex}`);
            });
          }
        });
      } else {
        const singleItem: ItemDetail = {
          description: response.itemDescription || "",
          content: response.itemContent || "",
          condition: response.itemCondition || "Good",
          weightGrams: response.itemWeightGrams || 0,
          karat: response.itemKarat || 24,
          appraisedValue: response.appraisedValue || 0,
          images: response.imageUrls || response.images || [],
        };
        setItems([singleItem]);

        if (singleItem.images && singleItem.images.length > 0) {
          singleItem.images.forEach((imageUrl: string, index: number) => {
            loadImageWithAuth(imageUrl, `0-${index}`);
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive",
      });
      navigate("/transactions");
    } finally {
      setTransactionLoading(false);
    }
  };

  const loadImageWithAuth = async (imageUrl: string, imageKey: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("token");

      let fullImageUrl = imageUrl;
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
        if (imageUrl.includes("pawn-transactions")) {
          const filename = imageUrl.split("pawn-transactions/")[1];
          fullImageUrl = `${apiBaseUrl}/images/pawn-transactions/${filename}`;
        } else {
          fullImageUrl = `${apiBaseUrl}${imageUrl}`;
        }
      }

      const response = await fetch(fullImageUrl, {
        method: "GET",
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (!response.ok) {
        console.error(`Failed to load image: ${fullImageUrl} (Status: ${response.status})`);
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setImageBlobUrls((prev) => ({
        ...prev,
        [imageKey]: blobUrl,
      }));
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  };

  const resolveManagerUserId = async () => {
    if (role === "MANAGER" && user?.id) {
      return user.id;
    }

    const staffBranchId = user?.branchId || branchId || null;
    if (!staffBranchId) {
      toast({
        title: "Error",
        description: "Branch ID not found for this staff user",
        variant: "destructive",
      });
      return null;
    }

    try {
      const users = await apiClient.users.getByBranch(staffBranchId);
      const manager = Array.isArray(users)
        ? users.find((u) => String(u.role).toUpperCase() === "MANAGER")
        : null;
      if (!manager?.id) {
        toast({
          title: "Error",
          description: "No branch manager found for this branch",
          variant: "destructive",
        });
        return null;
      }
      return manager.id as string;
    } catch (error) {
      console.error("Failed to resolve branch manager:", error);
      toast({
        title: "Error",
        description: "Failed to find branch manager",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleVerifyPin = async () => {
    if (!pinInput.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter manager PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setPinVerifying(true);
      const resolvedManagerId = managerUserId || (await resolveManagerUserId());
      if (!resolvedManagerId) return;
      setManagerUserId(resolvedManagerId);

      await apiClient.users.verifyPin(resolvedManagerId, pinInput.trim());
      setPinVerified(true);
      toast({
        title: "Verified",
        description: "Manager PIN verified. Editing enabled.",
      });
    } catch (error) {
      console.error("PIN verification failed:", error);
      toast({
        title: "Invalid PIN",
        description: "Branch manager PIN is incorrect",
        variant: "destructive",
      });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const detailsChanged =
      customerAddress !== originalCustomerAddress ||
      loanAmount !== originalLoanAmount ||
      selectedRateId !== originalRateId ||
      periodMonths !== originalPeriodMonths ||
      maturityDate !== originalMaturityDate;

    // PIN required only for details changes
    if (detailsChanged && !pinVerified) {
      toast({
        title: "PIN Required",
        description: "Enter branch manager PIN to edit address and transaction details",
        variant: "destructive",
      });
      return;
    }

    if (status === "Blocked" && !blockReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a block reason when setting status to Blocked",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);


      if (detailsChanged) {
        await apiClient.pawnTransactions.updateDetails(id!, {
          customerAddress,
          loanAmount: loanAmount ? Number(loanAmount) : null,
          interestRateId: selectedRateId || null,
          periodMonths: periodMonths ? Number(periodMonths) : null,
          maturityDate: maturityDate || null,
        });
      }

      if (status !== originalStatus) {
        await apiClient.pawnTransactions.updateStatus(id!, status);
      }

      await apiClient.pawnTransactions.updateRemarks(id!, remarks);

      if (status === "Blocked") {
        await apiClient.pawnTransactions.updateBlockReason(id!, {
          blockReason,
          policeReportNumber: policeReportNumber || null,
          policeReportDate: policeReportDate || null,
        });
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });

      // Navigate back to transaction history
      navigate("/transactions");

    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (imageUrl: string, imageKey: string) => {
    if (imageBlobUrls[imageKey]) {
      return imageBlobUrls[imageKey];
    }
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return "";
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  return (
    <>
      <LoadingOverlay isLoading={loading} />
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/transactions")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Pawn Transaction</h1>
            <p className="text-gray-500 mt-1">Pawn ID: {pawnId} | Date: {pawnDate}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Manager PIN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="managerPin" className="text-sm font-medium">
                    Branch Manager PIN
                  </Label>
                  <Input
                    id="managerPin"
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter manager PIN to enable editing"
                    disabled={pinVerified}
                  />
                </div>
                <Button
                  type="button"
                  variant={pinVerified ? "secondary" : "default"}
                  onClick={handleVerifyPin}
                  disabled={pinVerified || pinVerifying}
                  className="h-10"
                >
                  {pinVerified ? "Verified" : pinVerifying ? "Verifying..." : "Verify PIN"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Required to edit address and transaction details.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select value={gender} onValueChange={setGender} disabled>
                    <SelectTrigger id="gender" className="bg-muted">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idType" className="text-sm font-medium">
                    ID Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={idType} onValueChange={setIdType} disabled>
                    <SelectTrigger id="idType" className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIC">National Identity Card (NIC)</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="DrivingLicense">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerNic" className="text-sm font-medium">
                    {idType === "NIC" ? "NIC Number" : idType === "Passport" ? "Passport Number" : "License Number"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerNic"
                    value={customerNic}
                    onChange={(e) => setCustomerNic(e.target.value)}
                    placeholder={`Enter ${idType === "NIC" ? "NIC" : idType === "Passport" ? "passport" : "license"} number`}
                    required
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddress" className="text-sm font-medium">
                    Address
                  </Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                    disabled={!pinVerified}
                    className={!pinVerified ? "bg-muted" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Item Information ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-6">
                  {items.map((item, itemIndex) => (
                    <div key={itemIndex} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Item {itemIndex + 1}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium">
                            Item Description
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.description}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Item Content/Type
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.content || "N/A"}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Item Condition
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.condition}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Weight (grams)
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.weightGrams}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Karat
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.karat}K Gold</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Appraised Value (LKR)
                          </Label>
                          <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.appraisedValue.toFixed(2)}</p>
                        </div>
                      </div>

                      {item.images && item.images.length > 0 && (
                        <div className="space-y-4 mt-4">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Item Images ({item.images.length})
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {item.images.map((imageUrl: string, imageIndex: number) => (
                              <div key={imageIndex} className="relative group">
                                <img
                                  src={getImageSrc(imageUrl, `${itemIndex}-${imageIndex}`)}
                                  alt={`Item ${itemIndex + 1} Image ${imageIndex + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount" className="text-sm font-medium">
                    Loan Amount (LKR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    step="0.01"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Enter loan amount"
                    required
                    disabled={!pinVerified}
                    className={!pinVerified ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate" className="text-sm font-medium">
                    Interest Rate <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedRateId} onValueChange={setSelectedRateId} disabled={!pinVerified}>
                    <SelectTrigger id="interestRate" className={!pinVerified ? "bg-muted" : ""}>
                      <SelectValue placeholder="Select interest rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {rates.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} - {r.rate_percent}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodMonths" className="text-sm font-medium">
                    Period (months)
                  </Label>
                  <Select value={periodMonths} onValueChange={setPeriodMonths} disabled={!pinVerified}>
                    <SelectTrigger id="periodMonths" className={!pinVerified ? "bg-muted" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 6, 9, 12, 18, 24].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} months
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturityDate" className="text-sm font-medium">
                    Maturity Date
                  </Label>
                  <Input
                    id="maturityDate"
                    type="text"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    disabled={!pinVerified}
                    className={!pinVerified ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Transaction Status <span className="text-red-500">*</span>
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Defaulted">Defaulted</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {status === "Blocked" && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="blockReason" className="text-sm font-medium">
                        Block Reason <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="blockReason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Enter the reason for blocking this transaction..."
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="policeReportNumber" className="text-sm font-medium">
                        Police Report Number (Optional)
                      </Label>
                      <Input
                        id="policeReportNumber"
                        value={policeReportNumber}
                        onChange={(e) => setPoliceReportNumber(e.target.value)}
                        placeholder="e.g., PR-2026-12345"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="policeReportDate" className="text-sm font-medium">
                        Police Report Date (Optional)
                      </Label>
                      <Input
                        id="policeReportDate"
                        type="date"
                        value={policeReportDate}
                        onChange={(e) => setPoliceReportDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks / Notes
                  </Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add notes, payment details, or any other information..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/transactions")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Transaction"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
