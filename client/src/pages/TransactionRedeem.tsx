import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import Checks from "@/vendor/facit/components/bootstrap/forms/Checks";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import NumberInput from "@/components/facit/NumberInput";
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

export default function TransactionRedeem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const has = usePermission();

  const [loadingData, setLoadingData] = useState(true);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [transaction, setTransaction] = useState<Record<string, unknown> | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<Record<string, unknown> | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionAmountEdited, setRedemptionAmountEdited] = useState(false);
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [documentationAmount, setDocumentationAmount] = useState("0");
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [calculationPeriod, setCalculationPeriod] = useState<"MONTHLY" | "TWO_WEEKS">("MONTHLY");

  const toNumber = (value: unknown) => Number(value) || 0;

  /** Round a value up to the nearest multiple of 10 (101→110, 154→160, 200→200) */
  const ceilToNearest10 = (value: number) => Math.ceil(value / 10) * 10;

  const fixedCharges = 50;
  const documentationValue = Number(documentationAmount) || 0;
  const effectiveCharges = fixedCharges + documentationValue;
  const computedOutstandingTotal = ceilToNearest10(
    toNumber(outstandingBalance?.principal) + toNumber(outstandingBalance?.accrualInterest) + effectiveCharges
  );

  useEffect(() => {
    if (!redemptionAmountEdited && computedOutstandingTotal > 0) {
      setRedemptionAmount(String(computedOutstandingTotal));
    }
  }, [computedOutstandingTotal, redemptionAmountEdited]);

  useEffect(() => {
    if (!id) return;

    // Redirect immediately rather than firing a request the backend will 403 —
    // the /transactions/redeem/:id route is also guarded in App.tsx, but this
    // covers the component being reached any other way.
    if (!has("redemption.view.balance")) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        setRedemptionAmountEdited(false);
        setRedemptionAmount("");
        const [tx, balance] = await Promise.all([
          apiClient.pawnTransactions.getById(id),
          apiClient.pawnRedemptions.getOutstandingBalance(id, calculationPeriod),
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
        notify({ title: "Error", description: "Failed to load redemption details", variant: "destructive" });
        navigate("/transactions");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isFirstPeriodRender = useRef(true);
  useEffect(() => {
    if (isFirstPeriodRender.current) {
      isFirstPeriodRender.current = false;
      return;
    }
    if (!id) return;

    const refreshBalance = async () => {
      try {
        const balance = await apiClient.pawnRedemptions.getOutstandingBalance(id, calculationPeriod);
        setOutstandingBalance(balance);
      } catch (error) {
        console.error("Failed to refresh outstanding balance:", error);
        notify({ title: "Error", description: "Failed to refresh outstanding balance", variant: "destructive" });
      }
    };

    refreshBalance();
  }, [calculationPeriod, id]);

  const handleRedeemTransaction = async () => {
    if (!id) return;

    if (!redemptionAmount || parseFloat(redemptionAmount) <= 0) {
      notify({ title: "Validation Error", description: "Please enter a valid redemption amount", variant: "destructive" });
      return;
    }

    try {
      setRedemptionLoading(true);
      const notesWithDoc = `${redemptionNotes || ""}${redemptionNotes ? " | " : ""}Documentation: Rs. ${documentationValue.toLocaleString()}`;

      const result = await apiClient.pawnRedemptions.processRedemption(id, {
        redemptionAmount: parseFloat(redemptionAmount),
        notes: notesWithDoc,
        charges: effectiveCharges,
        calculationPeriod,
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

      navigate("/transactions");
    } catch (error) {
      console.error("Failed to process redemption:", error);
      const message = error instanceof Error ? error.message : "Failed to process redemption";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRedemptionLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading redemption details..." />;
  }

  return (
    <PageWrapper title="Process Gold Redemption">
      <LoadingOverlay isLoading={redemptionLoading} />
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb
            list={[
              { title: "Pawn Transactions", to: "/transactions" },
              { title: `Redeem ${String(transaction?.pawnId || transaction?.pawn_id || "")}`, to: `/transactions/redeem/${id}` },
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
                <CardTitle className="fs-6">Transaction Summary</CardTitle>
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
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Status</div>
                    <p className="fw-medium mb-0">{String(transaction?.status || "Active")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Calculation Period</CardTitle>
              </CardHeader>
              <CardBody className="pt-0 d-flex gap-4">
                <Checks type="radio" name="calcPeriod" id="period-monthly" label="Monthly" value="MONTHLY" checked={calculationPeriod === "MONTHLY"} onChange={() => setCalculationPeriod("MONTHLY")} />
                <Checks type="radio" name="calcPeriod" id="period-two-weeks" label="2 Weeks" value="TWO_WEEKS" checked={calculationPeriod === "TWO_WEEKS"} onChange={() => setCalculationPeriod("TWO_WEEKS")} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Outstanding Balance Breakdown</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">Principal:</span>
                  <span className="fw-medium">Rs. {toNumber(outstandingBalance?.principal).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">{calculationPeriod === "MONTHLY" ? "Accrued Interest (Monthly):" : "Accrued Interest (2 Weeks):"}</span>
                  <span className="fw-medium">Rs. {toNumber(outstandingBalance?.accrualInterest).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: "0.75rem" }}>
                  <span>Monthly Portion:</span>
                  <span>Rs. {toNumber(outstandingBalance?.monthlyInterest).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: "0.75rem" }}>
                  <span>Weekly Portion ({toNumber(outstandingBalance?.weeklyPeriodsCharged)} weeks):</span>
                  <span>Rs. {toNumber(outstandingBalance?.weeklyInterest).toLocaleString()}</span>
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
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Redemption Payment</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <FormGroup id="redemptionAmount" label="Redemption Amount (LKR) *" formText="Payment allocation: Interest → Charges → Principal" className="mb-1">
                  <NumberInput
                    id="redemptionAmount"
                    value={redemptionAmount}
                    onChange={(value) => { setRedemptionAmountEdited(true); setRedemptionAmount(value); }}
                    placeholder="Enter amount to pay"
                    required
                  />
                </FormGroup>
                <p className="text-muted mb-3" style={{ fontSize: "0.75rem" }}>
                  Interest is calculated weekly (Mon–Sun). Paying any day counts the full week.
                </p>

                {redemptionAmount && computedOutstandingTotal > 0 ? (
                  <div className="p-3 rounded border bg-body-tertiary mb-3">
                    {parseFloat(redemptionAmount) === computedOutstandingTotal ? (
                      <p className="small fw-semibold text-success mb-0">● Full Redemption (Complete Settlement)</p>
                    ) : parseFloat(redemptionAmount) < computedOutstandingTotal ? (
                      <>
                        <p className="small fw-semibold text-info mb-1">● Partial Payment</p>
                        <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                          Remaining Principal: Rs.{" "}
                          {(toNumber(outstandingBalance?.principal) - (parseFloat(redemptionAmount) - toNumber(outstandingBalance?.accrualInterest) - effectiveCharges)).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="small fw-semibold text-danger mb-0">● Amount exceeds outstanding balance</p>
                    )}
                  </div>
                ) : null}

                <FormGroup id="redemptionNotes" label="Notes (Optional)" className="mb-3">
                  <Textarea value={redemptionNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRedemptionNotes(e.target.value)} placeholder="Add any notes about this redemption" rows={4} />
                </FormGroup>

                <div className="d-flex gap-2">
                  <Button color="dark" isLight className="flex-grow-1" onClick={() => navigate("/transactions")}>
                    Cancel
                  </Button>
                  <Button color="primary" className="flex-grow-1" onClick={handleRedeemTransaction} isDisable={redemptionLoading || !redemptionAmount}>
                    {redemptionLoading && <Spinner isSmall inButton />}
                    {redemptionLoading ? "Processing..." : "Confirm Redemption"}
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
