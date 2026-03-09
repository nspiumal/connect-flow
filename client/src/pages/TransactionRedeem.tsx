import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ArrowLeft } from "lucide-react";
import apiClient from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: number;
  appraisedValue: number;
}

export default function TransactionRedeem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [transaction, setTransaction] = useState<Record<string, unknown> | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<Record<string, unknown> | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [documentationAmount, setDocumentationAmount] = useState("0");
  const [items, setItems] = useState<ItemDetail[]>([]);

  const toNumber = (value: unknown) => Number(value) || 0;

  const fixedCharges = 50;
  const documentationValue = Number(documentationAmount) || 0;
  const effectiveCharges = fixedCharges + documentationValue;
  const computedOutstandingTotal =
    toNumber(outstandingBalance?.principal) +
    toNumber(outstandingBalance?.accrualInterest) +
    effectiveCharges;

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingData(true);
        const [tx, balance] = await Promise.all([
          apiClient.pawnTransactions.getById(id),
          apiClient.pawnRedemptions.getOutstandingBalance(id),
        ]);

        setTransaction(tx);
        setOutstandingBalance(balance);

        if (tx.itemDetails && Array.isArray(tx.itemDetails) && tx.itemDetails.length > 0) {
          setItems(
            tx.itemDetails.map((item: Record<string, unknown>) => ({
              description: String(item.itemDescription || item.description || "N/A"),
              content: String(item.itemContent || item.content || "N/A"),
              condition: String(item.itemCondition || item.condition || "Good"),
              weightGrams: toNumber(item.itemWeightGrams || item.weightGrams),
              karat: toNumber(item.itemKarat || item.karat),
              appraisedValue: toNumber(item.appraisedValue),
            }))
          );
        } else {
          setItems([
            {
              description: String(tx.itemDescription || "N/A"),
              content: String(tx.itemContent || "N/A"),
              condition: String(tx.itemCondition || "Good"),
              weightGrams: toNumber(tx.itemWeightGrams),
              karat: toNumber(tx.itemKarat),
              appraisedValue: toNumber(tx.appraisedValue),
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load redemption data:", error);
        toast({
          title: "Error",
          description: "Failed to load redemption details",
          variant: "destructive",
        });
        navigate("/transactions");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const handleRedeemTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

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
      const notesWithDoc = `${redemptionNotes || ""}${
        redemptionNotes ? " | " : ""
      }Documentation: Rs. ${documentationValue.toLocaleString()}`;

      const result = await apiClient.pawnRedemptions.processRedemption(id, {
        redemptionAmount: parseFloat(redemptionAmount),
        notes: notesWithDoc,
      });

      if (result.isFullRedemption) {
        toast({
          title: "✓ Full Redemption Completed!",
          description: "Transaction marked as CLOSED. Gold will be released.",
        });
      } else {
        toast({
          title: "✓ Partial Payment Recorded!",
          description: `Remaining Principal: Rs. ${result.remainingPrincipal?.toLocaleString() || 0}`,
        });
      }

      navigate("/transactions");
    } catch (error: unknown) {
      console.error("Failed to process redemption:", error);
      const message = error instanceof Error ? error.message : "Failed to process redemption";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRedemptionLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading redemption details..." />;
  }

  return (
    <div className="space-y-4">
      <LoadingOverlay isLoading={redemptionLoading} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Process Gold Redemption</h1>
          <p className="text-sm text-muted-foreground">
            Pawn ID: {String(transaction?.pawnId || transaction?.pawn_id || "")}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
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
                  <p className="font-medium">{String(transaction?.customerName || transaction?.customer_name || "N/A")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NIC</Label>
                  <p className="font-medium">{String(transaction?.customerNic || transaction?.customer_nic || "N/A")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{String(transaction?.customerPhone || transaction?.customer_phone || "N/A")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="font-medium truncate">{String(transaction?.customerAddress || transaction?.customer_address || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-x-3 gap-y-2 p-3 rounded border bg-gray-50 text-sm">
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="font-medium">{item.description}</p>
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
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Appraised Value</Label>
                      <p className="font-medium">Rs. {item.appraisedValue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Balance Breakdown */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-900">Outstanding Balance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal:</span>
                <span className="font-medium">Rs. {toNumber(outstandingBalance?.principal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accrued Interest:</span>
                <span className="font-medium">Rs. {toNumber(outstandingBalance?.accrualInterest).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Charges:</span>
                <span className="font-medium">Rs. {fixedCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Documentation:</span>
                <Input
                  type="number"
                  step="0.01"
                  value={documentationAmount}
                  onChange={(e) => setDocumentationAmount(e.target.value)}
                  className="w-28 h-7 text-right text-sm"
                  placeholder="0"
                />
              </div>
              <hr className="my-2 border-amber-300" />
              <div className="flex justify-between font-bold text-amber-900">
                <span>Total Outstanding:</span>
                <span>Rs. {computedOutstandingTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Redemption Form */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Redemption Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRedeemTransaction} className="space-y-4">
                <div>
                  <Label htmlFor="redemptionAmount" className="text-sm">Redemption Amount (LKR) *</Label>
                  <Input
                    id="redemptionAmount"
                    type="number"
                    step="0.01"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(e.target.value)}
                    placeholder="Enter amount to pay"
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment allocation: Interest → Charges → Principal
                  </p>
                </div>

                {redemptionAmount && computedOutstandingTotal > 0 && (
                  <div className="p-3 rounded border bg-gray-50">
                    {parseFloat(redemptionAmount) === computedOutstandingTotal ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="h-2 w-2 rounded-full bg-green-700" />
                        <p className="text-sm font-semibold">Full Redemption (Complete Settlement)</p>
                      </div>
                    ) : parseFloat(redemptionAmount) < computedOutstandingTotal ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-700">
                          <div className="h-2 w-2 rounded-full bg-blue-700" />
                          <p className="text-sm font-semibold">Partial Payment</p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-4">
                          Remaining Principal: Rs. {(
                            toNumber(outstandingBalance?.principal) -
                            (parseFloat(redemptionAmount) - toNumber(outstandingBalance?.accrualInterest) - effectiveCharges)
                          ).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700">
                        <div className="h-2 w-2 rounded-full bg-red-700" />
                        <p className="text-sm font-semibold">Amount exceeds outstanding balance</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="redemptionNotes" className="text-sm">Notes (Optional)</Label>
                  <Textarea
                    id="redemptionNotes"
                    value={redemptionNotes}
                    onChange={(e) => setRedemptionNotes(e.target.value)}
                    placeholder="Add any notes about this redemption"
                    rows={4}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/transactions")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={redemptionLoading || !redemptionAmount}
                    className="flex-1"
                  >
                    {redemptionLoading ? "Processing..." : "Confirm Redemption"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

