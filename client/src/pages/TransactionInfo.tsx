import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, ArrowLeft } from "lucide-react";
import apiClient from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: number;
  appraisedValue: number;
  images: string[];
}

interface TransactionHistory {
  id: string;
  editedByName?: string;
  editedBy?: string;
  editType?: string;
  previousStatus?: string;
  previousAddress?: string;
  previousPhone?: string;
  previousLoanAmount?: number;
  previousInterestRateId?: string;
  previousPeriodMonths?: number;
  previousMaturityDate?: string;
  previousRemarks?: string;
  newStatus?: string;
  newAddress?: string;
  newPhone?: string;
  newLoanAmount?: number;
  newInterestRateId?: string;
  newPeriodMonths?: number;
  newMaturityDate?: string;
  newRemarks?: string;
  blockReason?: string;
  policeReportNumber?: string;
  policeReportDate?: string;
  createdAt?: string;
}

export default function TransactionInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [imageBlobUrls, setImageBlobUrls] = useState<{ [key: string]: string }>({});
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTransaction(id);
      fetchHistory(id);
    }
  }, [id]);

  const fetchTransaction = async (transactionId: string) => {
    try {
      setLoadingData(true);
      const response = await apiClient.pawnTransactions.getById(transactionId);
      setTransaction(response);

      if (response.itemDetails && Array.isArray(response.itemDetails) && response.itemDetails.length > 0) {
        const itemsWithImages = response.itemDetails.map((item: any) => ({
          description: item.itemDescription || item.description || "",
          content: item.itemContent || item.content || "",
          condition: item.itemCondition || item.condition || "Good",
          weightGrams: item.itemWeightGrams || item.weightGrams || 0,
          karat: item.itemKarat || item.karat || 24,
          appraisedValue: item.appraisedValue || 0,
          images: item.imageUrls || item.images || [],
        }));
        setItems(itemsWithImages);
        itemsWithImages.forEach((item: ItemDetail, itemIndex: number) => {
          item.images.forEach((imageUrl: string, imageIndex: number) => {
            loadImageWithAuth(imageUrl, `${itemIndex}-${imageIndex}`);
          });
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
        singleItem.images.forEach((imageUrl: string, index: number) => {
          loadImageWithAuth(imageUrl, `0-${index}`);
        });
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      toast({ title: "Error", description: "Failed to load transaction details", variant: "destructive" });
      navigate("/transactions");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchHistory = async (transactionId: string) => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.pawnTransactions.getHistory(transactionId, 10);
      setHistory(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadImageWithAuth = async (imageUrl: string, imageKey: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("token");
      let fullImageUrl = imageUrl;
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
        fullImageUrl = imageUrl.includes("pawn-transactions")
          ? `${apiBaseUrl}/images/pawn-transactions/${imageUrl.split("pawn-transactions/")[1]}`
          : `${apiBaseUrl}${imageUrl}`;
      }
      const response = await fetch(fullImageUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) return;
      const blob = await response.blob();
      setImageBlobUrls((prev) => ({ ...prev, [imageKey]: URL.createObjectURL(blob) }));
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  };

  const getImageSrc = (imageUrl: string, imageKey: string) => {
    if (imageBlobUrls[imageKey]) return imageBlobUrls[imageKey];
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) return imageUrl;
    return "";
  };

  const statusBadgeVariant = (s: string) => {
    if (s === "Active") return "default";
    if (s === "Completed") return "secondary";
    if (s === "Profited") return "outline";
    return "destructive";
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const renderChange = (label: string, previousValue?: string | number, newValue?: string | number) => {
    if (previousValue == null && newValue == null) return null;
    return (
      <div className="text-xs text-foreground/80">
        <span className="font-medium">{label}:</span> {previousValue ?? "—"} → {newValue ?? "—"}
      </div>
    );
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  const status = transaction?.status || "Active";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Transaction Info</h1>
          <p className="text-sm text-muted-foreground">
            Pawn ID: {transaction?.pawnId || transaction?.pawn_id}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">

        {/* ── Left Column ── */}
        <div className="space-y-4">

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer Name</Label>
                  <p className="font-medium">{transaction?.customerName || transaction?.customer_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <p className="font-medium">{transaction?.gender || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID Type</Label>
                  <p className="font-medium">{transaction?.idType || transaction?.id_type || "NIC"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID Number</Label>
                  <p className="font-medium">{transaction?.customerNic || transaction?.customer_nic || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{transaction?.customerPhone || transaction?.customer_phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="font-medium truncate">{transaction?.customerAddress || transaction?.customer_address || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Item Details ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, itemIndex) => (
                  <div key={itemIndex} className="p-3 rounded border bg-muted/30 space-y-2 text-sm">
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
                        <p className="font-medium">{item.condition}</p>
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

                    {/* Item Images */}
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
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">

          {/* Transaction Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Loan Amount</Label>
                  <p className="font-medium">Rs. {Number(transaction?.loanAmount || transaction?.loan_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Interest Rate</Label>
                  <p className="font-medium">{transaction?.interestRatePercent || transaction?.interest_rate_percent}%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Period</Label>
                  <p className="font-medium">{transaction?.periodMonths || transaction?.period_months} months</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pawn Date</Label>
                  <p className="font-medium">{transaction?.pawnDate || transaction?.pawn_date || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maturity Date</Label>
                  <p className="font-medium">{transaction?.maturityDate || transaction?.maturity_date || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge
                    variant={statusBadgeVariant(status) as any}
                    className={status === "Profited" ? "border-purple-500 text-purple-600 bg-purple-50" : ""}
                  >
                    {status}
                  </Badge>
                </div>
                {transaction?.remarks && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Remarks</Label>
                    <p className="font-medium text-sm">{transaction.remarks}</p>
                  </div>
                )}
                {status === "Blocked" && (
                  <>
                    <div className="col-span-2">
                      <Label className="text-xs text-red-500">Block Reason</Label>
                      <p className="font-medium text-sm text-destructive">{transaction?.blockReason || transaction?.block_reason || "—"}</p>
                    </div>
                    {transaction?.policeReportNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Police Report No.</Label>
                        <p className="font-medium">{transaction.policeReportNumber}</p>
                      </div>
                    )}
                    {transaction?.policeReportDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Police Report Date</Label>
                        <p className="font-medium">{transaction.policeReportDate}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Edit History (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <p className="text-xs text-muted-foreground">Loading history...</p>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="p-3 border rounded bg-muted/30 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{entry.editType || "EDIT"}</Badge>
                        <span className="text-xs text-foreground/80 font-medium">
                          {entry.editedByName || entry.editedBy || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                      </div>

                      {renderChange("Status", entry.previousStatus, entry.newStatus)}
                      {renderChange("Address", entry.previousAddress, entry.newAddress)}
                      {renderChange("Phone", entry.previousPhone, entry.newPhone)}

                      {entry.editType === "REDEMPTION" && entry.newLoanAmount != null && (
                        <div className="text-xs text-foreground/80">
                          <span className="font-medium">Remaining Balance:</span>{" "}
                          <span className="text-orange-600 font-semibold">
                            Rs. {Number(entry.newLoanAmount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {entry.editType !== "REDEMPTION" && renderChange("Loan Amount", entry.previousLoanAmount, entry.newLoanAmount)}
                      {renderChange("Period (Months)", entry.previousPeriodMonths, entry.newPeriodMonths)}
                      {renderChange("Maturity Date", entry.previousMaturityDate, entry.newMaturityDate)}

                      {entry.editType === "REDEMPTION" && entry.newRemarks && (
                        <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          <span className="font-medium text-blue-900">Payment Details:</span>
                          <p className="text-blue-800 mt-0.5">{entry.newRemarks}</p>
                        </div>
                      )}
                      {entry.editType !== "REDEMPTION" && renderChange("Remarks", entry.previousRemarks, entry.newRemarks)}

                      {entry.blockReason && (
                        <div className="text-xs text-foreground/80">
                          <span className="font-medium">Block Reason:</span> {entry.blockReason}
                        </div>
                      )}
                      {entry.policeReportNumber && (
                        <div className="text-xs text-foreground/80">
                          <span className="font-medium">Police Report No.:</span> {entry.policeReportNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No edit history found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

