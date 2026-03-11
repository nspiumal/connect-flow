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
import { useAuth } from "@/contexts/AuthContext";

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: number;
  appraisedValue: number;
}

export default function TransactionProfit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [profitLoading, setProfitLoading] = useState(false);
  const [transaction, setTransaction] = useState<Record<string, unknown> | null>(null);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNotes, setProfitNotes] = useState("");
  const [items, setItems] = useState<ItemDetail[]>([]);

  const toNumber = (value: unknown) => Number(value) || 0;

  useEffect(() => {
    // Check role access
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "MANAGER") {
      toast({
        title: "Access Denied",
        description: "Only Admin and Branch Manager can access this page",
        variant: "destructive",
      });
      navigate("/transactions");
      return;
    }

    if (!id) return;

    const loadData = async () => {
      try {
        setLoadingData(true);
        const tx = await apiClient.pawnTransactions.getById(id);

        setTransaction(tx);

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
        console.error("Failed to load transaction data:", error);
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

    loadData();
  }, [id, navigate, toast, role]);

  const handleSetProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!profitAmount || parseFloat(profitAmount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid profit amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setProfitLoading(true);

      await apiClient.pawnTransactions.setProfit(id, {
        profitAmount: parseFloat(profitAmount),
        notes: profitNotes,
      });

      toast({
        title: "✓ Profit Recorded!",
        description: `Transaction marked as profited. Amount: Rs. ${parseFloat(profitAmount).toLocaleString()}`,
      });

      navigate("/transactions");
    } catch (error: unknown) {
      console.error("Failed to record profit:", error);
      const message = error instanceof Error ? error.message : "Failed to record profit";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProfitLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  return (
    <div className="space-y-4">
      <LoadingOverlay isLoading={profitLoading} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Set Transaction as Profited</h1>
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

        </div>

        {/* Right Column - Transaction Details + Profit Form */}
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
                  <p className="font-medium">Rs. {toNumber(transaction?.loanAmount).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Interest Rate</Label>
                  <p className="font-medium">{toNumber(transaction?.interestRatePercent)}%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pawn Date</Label>
                  <p className="font-medium">{String(transaction?.pawnDate || transaction?.pawn_date || "N/A")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maturity Date</Label>
                  <p className="font-medium">{String(transaction?.maturityDate || transaction?.maturity_date || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Set Profit Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Set Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetProfit} className="space-y-4">
                <div>
                  <Label htmlFor="profitAmount" className="text-sm">Profit Amount (LKR) *</Label>
                  <Input
                    id="profitAmount"
                    type="number"
                    step="0.01"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    placeholder="Enter profit amount"
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the profit amount for this transaction
                  </p>
                </div>

                {profitAmount && (
                  <div className="p-3 rounded border bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-700" />
                      <p className="text-sm font-semibold text-blue-700">Profit Amount: Rs. {parseFloat(profitAmount).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="profitNotes" className="text-sm">Notes (Optional)</Label>
                  <Textarea
                    id="profitNotes"
                    value={profitNotes}
                    onChange={(e) => setProfitNotes(e.target.value)}
                    placeholder="Add any notes about this profit"
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
                    disabled={profitLoading || !profitAmount}
                    className="flex-1"
                  >
                    {profitLoading ? "Processing..." : "Set Profit"}
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

