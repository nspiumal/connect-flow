import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { usePermission } from "@/hooks/usePermission";
import { formatWeight } from "@/lib/utils";

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
  const has = usePermission();

  const [loadingData, setLoadingData] = useState(true);
  const [profitLoading, setProfitLoading] = useState(false);
  const [transaction, setTransaction] = useState<Record<string, unknown> | null>(null);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNotes, setProfitNotes] = useState("");
  const [items, setItems] = useState<ItemDetail[]>([]);

  const toNumber = (value: unknown) => Number(value) || 0;

  useEffect(() => {
    if (!has("profit.record")) {
      notify({ title: "Access Denied", description: "Only Admin and Branch Manager can access this page", variant: "destructive" });
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
        notify({ title: "Error", description: "Failed to load transaction details", variant: "destructive" });
        navigate("/transactions");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSetProfit = async () => {
    if (!id) return;

    if (!profitAmount || parseFloat(profitAmount) <= 0) {
      notify({ title: "Validation Error", description: "Please enter a valid forfeit amount", variant: "destructive" });
      return;
    }

    try {
      setProfitLoading(true);

      await apiClient.pawnTransactions.setProfit(id, {
        profitAmount: parseFloat(profitAmount),
        notes: profitNotes,
      });

      notify({ title: "✓ Forfeit Recorded!", description: `Transaction marked as forfeited. Amount: Rs. ${parseFloat(profitAmount).toLocaleString()}`, variant: "success" });

      navigate("/transactions");
    } catch (error) {
      console.error("Failed to record profit:", error);
      const message = error instanceof Error ? error.message : "Failed to record forfeit";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setProfitLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  return (
    <PageWrapper title="Set Transaction as Forfeited">
      <LoadingOverlay isLoading={profitLoading} />
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb
            list={[
              { title: "Pawn Transactions", to: "/transactions" },
              { title: `Forfeit ${String(transaction?.pawnId || transaction?.pawn_id || "")}`, to: `/transactions/profit/${id}` },
            ]}
          />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <div className="row g-4">
          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Customer Information</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Customer Name</div>
                    <p className="fw-medium mb-0">{String(transaction?.customerName || transaction?.customer_name || "N/A")}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>NIC</div>
                    <p className="fw-medium mb-0">{String(transaction?.customerNic || transaction?.customer_nic || "N/A")}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Phone</div>
                    <p className="fw-medium mb-0">{String(transaction?.customerPhone || transaction?.customer_phone || "N/A")}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Address</div>
                    <p className="fw-medium text-truncate mb-0">{String(transaction?.customerAddress || transaction?.customer_address || "N/A")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Item Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-0 d-flex flex-column gap-3">
                {items.map((item, index) => (
                  <div key={index} className="row g-2 p-3 rounded border bg-body-tertiary small">
                    <div className="col-12">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Description</div>
                      <p className="fw-medium mb-0">{item.description}</p>
                    </div>
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Weight</div>
                      <p className="fw-medium mb-0">{formatWeight(item.weightGrams)}g</p>
                    </div>
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Karat</div>
                      <p className="fw-medium mb-0">{item.karat}K</p>
                    </div>
                    <div className="col-4">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Condition</div>
                      <p className="fw-medium mb-0">{item.condition}</p>
                    </div>
                    <div className="col-6">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Appraised Value</div>
                      <p className="fw-medium mb-0">Rs. {item.appraisedValue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Transaction Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Loan Amount</div>
                    <p className="fw-medium mb-0">Rs. {toNumber(transaction?.loanAmount).toLocaleString()}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Interest Rate</div>
                    <p className="fw-medium mb-0">{toNumber(transaction?.interestRatePercent)}%</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pawn Date</div>
                    <p className="fw-medium mb-0">{String(transaction?.pawnDate || transaction?.pawn_date || "N/A")}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Maturity Date</div>
                    <p className="fw-medium mb-0">{String(transaction?.maturityDate || transaction?.maturity_date || "N/A")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Set Forfeit</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <FormGroup id="profitAmount" label="Forfeit Amount (LKR) *" formText="Enter the forfeit amount for this transaction" className="mb-3">
                  <Input type="number" step={0.01} value={profitAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfitAmount(e.target.value)} placeholder="Enter forfeit amount" required />
                </FormGroup>

                {profitAmount && (
                  <div className="p-3 rounded border bg-body-tertiary mb-3">
                    <p className="small fw-semibold text-info mb-0">● Forfeit Amount: Rs. {parseFloat(profitAmount).toLocaleString()}</p>
                  </div>
                )}

                <FormGroup id="profitNotes" label="Notes (Optional)" className="mb-3">
                  <Textarea value={profitNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfitNotes(e.target.value)} placeholder="Add any notes about this forfeit" rows={4} />
                </FormGroup>

                <div className="d-flex gap-2">
                  <Button color="dark" isLight className="flex-grow-1" onClick={() => navigate("/transactions")}>
                    Cancel
                  </Button>
                  <Button color="primary" className="flex-grow-1" onClick={handleSetProfit} isDisable={profitLoading || !profitAmount}>
                    {profitLoading && <Spinner isSmall inButton />}
                    {profitLoading ? "Processing..." : "Set Forfeit"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
}
