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
  const [originalCustomerPhone, setOriginalCustomerPhone] = useState("");

  const [items, setItems] = useState<ItemDetail[]>([]);

  const [loanAmount, setLoanAmount] = useState("");
  const [originalLoanAmount, setOriginalLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [originalRateId, setOriginalRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [originalPeriodMonths, setOriginalPeriodMonths] = useState("6");
  const [remarks, setRemarks] = useState("");

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
      setOriginalCustomerPhone(response.customerPhone || "");

      setLoanAmount(response.loanAmount ? String(response.loanAmount) : "");
      setOriginalLoanAmount(response.loanAmount ? String(response.loanAmount) : "");
      setSelectedRateId(response.interestRateId || "");
      setOriginalRateId(response.interestRateId || "");
      setPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setOriginalPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setRemarks(response.remarks || "");

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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
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
      customerPhone !== originalCustomerPhone ||
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

    try {
      setLoading(true);


      if (detailsChanged) {
        await apiClient.pawnTransactions.updateDetails(id!, {
          customerAddress,
          customerPhone,
          loanAmount: loanAmount ? Number(loanAmount) : null,
          interestRatePercent: selectedRateId ? Number(selectedRateId) : null,
          periodMonths: periodMonths ? Number(periodMonths) : null,
          maturityDate: maturityDate || null,
        });
      }

      await apiClient.pawnTransactions.updateRemarks(id!, remarks);

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
    <div className="space-y-4">
      <LoadingOverlay isLoading={loading} />

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Pawn Transaction</h1>
          <p className="text-sm text-muted-foreground">Pawn ID: {pawnId} | Date: {pawnDate}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Customer Name</Label>
                    <p className="font-medium">{customerName || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gender</Label>
                    <p className="font-medium">{gender || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ID Type</Label>
                    <p className="font-medium">{idType || "NIC"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ID Number</Label>
                    <p className="font-medium">{customerNic || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="customerPhone" className="text-xs text-muted-foreground">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      disabled={!pinVerified}
                      className={`mt-1 h-9 ${!pinVerified ? "bg-muted" : ""}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="customerAddress" className="text-xs text-muted-foreground">Address</Label>
                    <Input
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter address"
                      disabled={!pinVerified}
                      className={`mt-1 h-9 ${!pinVerified ? "bg-muted" : ""}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Item Details ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, itemIndex) => (
                      <div key={itemIndex} className="p-3 rounded border bg-gray-50 text-sm space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Item {itemIndex + 1}</p>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                          <div className="col-span-3">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="font-medium">{item.description || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Weight</Label>
                            <p className="font-medium">{item.weightGrams}g</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Karat</Label>
                            <p className="font-medium">{item.karat}K</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Condition</Label>
                            <p className="font-medium">{item.condition || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Content/Type</Label>
                            <p className="font-medium">{item.content || "N/A"}</p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Appraised Value</Label>
                            <p className="font-medium">Rs. {item.appraisedValue.toLocaleString()}</p>
                          </div>
                        </div>

                        {item.images && item.images.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" /> Images ({item.images.length})
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              {item.images.map((imageUrl: string, imageIndex: number) => (
                                <img
                                  key={imageIndex}
                                  src={getImageSrc(imageUrl, `${itemIndex}-${imageIndex}`)}
                                  alt={`Item ${itemIndex + 1} Image ${imageIndex + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items found</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Manager PIN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="managerPin" className="text-xs text-muted-foreground">Branch Manager PIN</Label>
                  <Input
                    id="managerPin"
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter manager PIN to enable editing"
                    disabled={pinVerified}
                    className="mt-1 h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant={pinVerified ? "secondary" : "default"}
                  onClick={handleVerifyPin}
                  disabled={pinVerified || pinVerifying}
                  className="w-full"
                >
                  {pinVerified ? "Verified" : pinVerifying ? "Verifying..." : "Verify PIN"}
                </Button>
                <p className="text-xs text-muted-foreground">Required to edit address and transaction details.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <Label htmlFor="loanAmount" className="text-xs text-muted-foreground">Loan Amount (LKR)</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      step="0.01"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      disabled
                      className="mt-1 h-9 bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestRate" className="text-xs text-muted-foreground">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={selectedRateId}
                      onChange={(e) => setSelectedRateId(e.target.value)}
                      placeholder="Enter interest rate"
                      disabled={!pinVerified}
                      className={`mt-1 h-9 ${!pinVerified ? "bg-muted" : ""}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodMonths" className="text-xs text-muted-foreground">Period (months)</Label>
                    <Select value={periodMonths} onValueChange={setPeriodMonths} disabled>
                      <SelectTrigger id="periodMonths" className="mt-1 h-9 bg-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 6, 9, 12, 18, 24].map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maturityDate" className="text-xs text-muted-foreground">Maturity Date</Label>
                    <Input
                      id="maturityDate"
                      type="text"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      disabled
                      className="mt-1 h-9 bg-muted"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="remarks" className="text-xs text-muted-foreground">Remarks / Notes</Label>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add notes, payment details, or any other information..."
                      rows={4}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/transactions")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Updating..." : "Update Transaction"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
