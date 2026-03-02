import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  previousLoanAmount?: number;
  previousInterestRateId?: string;
  previousPeriodMonths?: number;
  previousMaturityDate?: string;
  previousRemarks?: string;
  newStatus?: string;
  newAddress?: string;
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
  const [imageBlobUrls, setImageBlobUrls] = useState<{[key: string]: string}>({});
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

      if (response.status === 401) {
        console.error("401 Unauthorized - redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

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

  const getImageSrc = (imageUrl: string, imageKey: string) => {
    if (imageBlobUrls[imageKey]) {
      return imageBlobUrls[imageKey];
    }
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return "";
  };

  const statusBadge = (s: string) => {
    if (s === "Active") return "default";
    if (s === "Completed") return "secondary";
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
      <div className="text-sm text-gray-700">
        <span className="font-medium">{label}:</span> {previousValue ?? "-"} → {newValue ?? "-"}
      </div>
    );
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/transactions")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pawn Transaction Info</h1>
          <p className="text-gray-500 mt-1">Pawn ID: {transaction?.pawnId || transaction?.pawn_id}</p>
        </div>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer Name</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.customerName || transaction?.customer_name}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gender</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.gender || "Not specified"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">ID Type</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.idType || transaction?.id_type || "NIC"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">ID Number</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.customerNic || transaction?.customer_nic}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.customerPhone || transaction?.customer_phone || "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.customerAddress || transaction?.customer_address || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Information */}
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
                      <Label className="text-sm font-medium">Item Description</Label>
                      <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.description}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Item Content/Type</Label>
                      <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.content || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Item Condition</Label>
                      <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.condition}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Weight (grams)</Label>
                      <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.weightGrams}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Karat</Label>
                      <p className="text-sm text-gray-700 p-2 bg-white rounded border">{item.karat}K Gold</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Appraised Value (LKR)</Label>
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

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Loan Amount (LKR)</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                Rs. {Number(transaction?.loanAmount || transaction?.loan_amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Interest Rate</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.interestRatePercent || transaction?.interest_rate_percent}%
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Period (months)</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.periodMonths || transaction?.period_months}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maturity Date</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.maturityDate || transaction?.maturity_date}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="p-2 bg-muted rounded border">
                <Badge variant={statusBadge(transaction?.status || "Active") as any}>
                  {transaction?.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pawn Date</Label>
              <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                {transaction?.pawnDate || transaction?.pawn_date}
              </p>
            </div>
            {transaction?.remarks && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Remarks / Notes</Label>
                <Textarea value={transaction?.remarks} readOnly rows={3} />
              </div>
            )}
            {transaction?.status === "Blocked" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-red-600">Block Reason</Label>
                  <Textarea value={transaction?.blockReason || transaction?.block_reason || ""} readOnly rows={3} />
                </div>
                {transaction?.policeReportNumber && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Police Report Number</Label>
                    <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                      {transaction?.policeReportNumber || transaction?.police_report_number}
                    </p>
                  </div>
                )}
                {transaction?.policeReportDate && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Police Report Date</Label>
                    <p className="text-sm text-gray-700 p-2 bg-muted rounded border">
                      {transaction?.policeReportDate || transaction?.police_report_date}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Edit History (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-sm text-gray-500">Loading history...</p>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{entry.editType || "EDIT"}</Badge>
                    <span className="text-sm text-gray-700">
                      {entry.editedByName || entry.editedBy || "Unknown user"}
                    </span>
                    <span className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</span>
                  </div>

                  {renderChange("Status", entry.previousStatus, entry.newStatus)}
                  {renderChange("Address", entry.previousAddress, entry.newAddress)}

                  {/* Show Remaining Balance for REDEMPTION type */}
                  {entry.editType === "REDEMPTION" && entry.newLoanAmount && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Remaining Balance:</span>{" "}
                      <span className="text-orange-600 font-semibold">
                        Rs. {Number(entry.newLoanAmount).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Show Loan Amount change for non-REDEMPTION edits */}
                  {entry.editType !== "REDEMPTION" && renderChange("Loan Amount", entry.previousLoanAmount, entry.newLoanAmount)}

                  {renderChange("Interest Rate ID", entry.previousInterestRateId, entry.newInterestRateId)}
                  {renderChange("Period (Months)", entry.previousPeriodMonths, entry.newPeriodMonths)}
                  {renderChange("Maturity Date", entry.previousMaturityDate, entry.newMaturityDate)}

                  {/* Show Redemption Details for REDEMPTION type */}
                  {entry.editType === "REDEMPTION" && entry.newRemarks && (
                    <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                      <span className="font-medium text-blue-900">Payment Details:</span>
                      <p className="text-blue-800 mt-1">{entry.newRemarks}</p>
                    </div>
                  )}

                  {/* Show Remarks for non-REDEMPTION edits */}
                  {entry.editType !== "REDEMPTION" && renderChange("Remarks", entry.previousRemarks, entry.newRemarks)}

                  {entry.blockReason && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Block Reason:</span> {entry.blockReason}
                    </div>
                  )}
                  {entry.policeReportNumber && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Police Report Number:</span> {entry.policeReportNumber}
                    </div>
                  )}
                  {entry.policeReportDate && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Police Report Date:</span> {entry.policeReportDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No edit history found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

