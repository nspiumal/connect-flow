import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { notify } from "@/components/facit/notify";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/integrations/api";
import { formatWeight } from "@/lib/utils";

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: number;
  appraisedValue: number;
  images: string[];
}

export default function TransactionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, branchId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const loadingData = ratesLoading || transactionLoading;
  const [rates, setRates] = useState<Array<{ id: string; name: string; rate_percent: number; ratePercent?: number; isDefault?: boolean }>>([]);

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

  const [imageBlobUrls, setImageBlobUrls] = useState<{ [key: string]: string }>({});

  const [pinInput, setPinInput] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [managerUserId, setManagerUserId] = useState<string | null>(null);

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

      const response = await fetch(fullImageUrl, { method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) {
        console.error(`Failed to load image: ${fullImageUrl} (Status: ${response.status})`);
        return;
      }

      const blob = await response.blob();
      setImageBlobUrls((prev) => ({ ...prev, [imageKey]: URL.createObjectURL(blob) }));
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  };

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      notify({ title: "Error", description: "Failed to load interest rates", variant: "destructive" });
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
      setSelectedRateId(response.interestRatePercent != null ? String(response.interestRatePercent) : "");
      setOriginalRateId(response.interestRatePercent != null ? String(response.interestRatePercent) : "");
      setPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setOriginalPeriodMonths(response.periodMonths ? String(response.periodMonths) : "6");
      setRemarks(response.remarks || "");

      setPawnId(response.pawnId || "");
      setPawnDate(response.pawnDate || "");
      setMaturityDate(response.maturityDate || "");
      setOriginalMaturityDate(response.maturityDate || "");

      if (response.itemDetails && Array.isArray(response.itemDetails) && response.itemDetails.length > 0) {
        const itemsWithImages = response.itemDetails.map((item: ItemDetail & { itemDescription?: string; itemContent?: string; itemCondition?: string; itemWeightGrams?: number; itemKarat?: number; imageUrls?: string[]; images?: string[] }) => ({
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
          item.images?.forEach((imageUrl: string, imageIndex: number) => loadImageWithAuth(imageUrl, `${itemIndex}-${imageIndex}`));
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
        singleItem.images?.forEach((imageUrl: string, index: number) => loadImageWithAuth(imageUrl, `0-${index}`));
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      notify({ title: "Error", description: "Failed to load transaction details", variant: "destructive" });
      navigate("/transactions");
    } finally {
      setTransactionLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    if (id) {
      fetchTransaction();
    } else {
      setTransactionLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If the transaction has no interest rate, pre-fill the default rate.
  // originalRateId is set too, so an untouched default is not sent as an update.
  useEffect(() => {
    if (ratesLoading || transactionLoading || selectedRateId) return;
    const defaultRate = rates.find((r) => r.isDefault) || rates[0];
    const percent = defaultRate?.ratePercent ?? defaultRate?.rate_percent;
    if (percent != null) {
      setSelectedRateId(String(percent));
      setOriginalRateId(String(percent));
    }
  }, [ratesLoading, transactionLoading, rates, selectedRateId]);

  const resolveManagerUserId = async () => {
    if (role === "MANAGER" && user?.id) {
      return user.id;
    }

    const staffBranchId = user?.branchId || branchId || null;
    if (!staffBranchId) {
      notify({ title: "Error", description: "Branch ID not found for this staff user", variant: "destructive" });
      return null;
    }

    try {
      const users = await apiClient.users.getByBranch(staffBranchId);
      const manager = Array.isArray(users)
        ? users.find((u) => Array.isArray(u.roles) && u.roles.some((r: { role?: string }) => String(r.role).toUpperCase() === "MANAGER"))
        : null;
      if (!manager?.id) {
        notify({ title: "Error", description: "No branch manager found for this branch", variant: "destructive" });
        return null;
      }
      return manager.id as string;
    } catch (error) {
      console.error("Failed to resolve branch manager:", error);
      notify({ title: "Error", description: "Failed to find branch manager", variant: "destructive" });
      return null;
    }
  };

  const handleVerifyPin = async () => {
    if (!pinInput.trim()) {
      notify({ title: "Validation Error", description: "Please enter manager PIN", variant: "destructive" });
      return;
    }

    try {
      setPinVerifying(true);
      const resolvedManagerId = managerUserId || (await resolveManagerUserId());
      if (!resolvedManagerId) return;
      setManagerUserId(resolvedManagerId);

      await apiClient.users.verifyPin(resolvedManagerId, pinInput.trim());
      setPinVerified(true);
      notify({ title: "Verified", description: "Manager PIN verified. Editing enabled.", variant: "success" });
    } catch (error) {
      console.error("PIN verification failed:", error);
      notify({ title: "Invalid PIN", description: "Branch manager PIN is incorrect", variant: "destructive" });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleSubmit = async () => {
    const detailsChanged =
      customerAddress !== originalCustomerAddress ||
      customerPhone !== originalCustomerPhone ||
      loanAmount !== originalLoanAmount ||
      selectedRateId !== originalRateId ||
      periodMonths !== originalPeriodMonths ||
      maturityDate !== originalMaturityDate;

    if (detailsChanged && !pinVerified) {
      notify({ title: "PIN Required", description: "Enter branch manager PIN to edit address and transaction details", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      if (detailsChanged) {
        // Send only changed fields — the backend leaves null fields untouched.
        await apiClient.pawnTransactions.updateDetails(id!, {
          customerAddress: customerAddress !== originalCustomerAddress ? customerAddress : null,
          customerPhone: customerPhone !== originalCustomerPhone ? customerPhone : null,
          loanAmount: loanAmount !== originalLoanAmount && loanAmount ? Number(loanAmount) : null,
          interestRatePercent: selectedRateId !== originalRateId && selectedRateId ? Number(selectedRateId) : null,
          periodMonths: periodMonths !== originalPeriodMonths && periodMonths ? Number(periodMonths) : null,
          maturityDate: maturityDate !== originalMaturityDate && maturityDate ? maturityDate : null,
        });
      }

      await apiClient.pawnTransactions.updateRemarks(id!, remarks);
      notify({ title: "Success", description: "Transaction updated successfully", variant: "success" });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      const message = error instanceof Error ? error.message : "Failed to update transaction";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (imageUrl: string, imageKey: string) => {
    if (imageBlobUrls[imageKey]) return imageBlobUrls[imageKey];
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) return imageUrl;
    return "";
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  return (
    <PageWrapper title="Edit Pawn Transaction">
      <LoadingOverlay isLoading={loading} />
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb
            list={[
              { title: "Pawn Transactions", to: "/transactions" },
              { title: `Edit ${pawnId}`, to: `/transactions/edit/${id}` },
            ]}
          />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <p className="text-muted small mb-3">Receipt No: {pawnId} | Date: {pawnDate}</p>

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
                    <p className="fw-medium mb-0">{customerName || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Gender</div>
                    <p className="fw-medium mb-0">{gender || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>ID Type</div>
                    <p className="fw-medium mb-0">{idType || "NIC"}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>ID Number</div>
                    <p className="fw-medium mb-0">{customerNic || "N/A"}</p>
                  </div>
                  <div className="col-12">
                    <FormGroup id="customerPhone" label="Phone">
                      <Input value={customerPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)} placeholder="Enter phone number" disabled={!pinVerified} />
                    </FormGroup>
                  </div>
                  <div className="col-12">
                    <FormGroup id="customerAddress" label="Address">
                      <Input value={customerAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerAddress(e.target.value)} placeholder="Enter address" disabled={!pinVerified} />
                    </FormGroup>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Item Details ({items.length})</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                {items.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {items.map((item, itemIndex) => (
                      <div key={itemIndex} className="p-3 rounded border bg-body-tertiary small">
                        <p className="text-muted fw-semibold" style={{ fontSize: "0.75rem" }}>Item {itemIndex + 1}</p>
                        <div className="row g-2">
                          <div className="col-12">
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Description</div>
                            <p className="fw-medium mb-0">{item.description || "N/A"}</p>
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
                            <p className="fw-medium mb-0">{item.condition || "N/A"}</p>
                          </div>
                          <div className="col-6">
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Content/Type</div>
                            <p className="fw-medium mb-0">{item.content || "N/A"}</p>
                          </div>
                          <div className="col-6">
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Appraised Value</div>
                            <p className="fw-medium mb-0">Rs. {item.appraisedValue.toLocaleString()}</p>
                          </div>
                        </div>

                        {item.images && item.images.length > 0 && (
                          <div className="pt-2">
                            <div className="text-muted mb-2" style={{ fontSize: "0.75rem" }}>Images ({item.images.length})</div>
                            <div className="row g-2">
                              {item.images.map((imageUrl, imageIndex) => (
                                <div key={imageIndex} className="col-4">
                                  <img
                                    src={getImageSrc(imageUrl, `${itemIndex}-${imageIndex}`)}
                                    alt={`Item ${itemIndex + 1} Image ${imageIndex + 1}`}
                                    className="w-100 rounded border"
                                    style={{ height: 80, objectFit: "cover" }}
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
                  <p className="small text-muted mb-0">No items found</p>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Manager PIN</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <FormGroup id="managerPin" label="Branch Manager PIN" className="mb-3">
                  <Input
                    type="password"
                    value={pinInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPinInput(e.target.value)}
                    placeholder="Enter manager PIN to enable editing"
                    disabled={pinVerified}
                  />
                </FormGroup>
                <Button color={pinVerified ? "secondary" : "primary"} className="w-100" onClick={handleVerifyPin} isDisable={pinVerified || pinVerifying}>
                  {pinVerified ? "Verified" : pinVerifying ? "Verifying..." : "Verify PIN"}
                </Button>
                <p className="small text-muted mt-2 mb-0">Required to edit address and transaction details.</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Transaction Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <FormGroup id="loanAmount" label="Loan Amount (LKR)">
                      <Input type="number" step={0.01} value={loanAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoanAmount(e.target.value)} disabled />
                    </FormGroup>
                  </div>
                  <div className="col-12 col-sm-6">
                    <FormGroup id="interestRate" label="Interest Rate (%)">
                      <Input
                        type="number"
                        step={0.01}
                        value={selectedRateId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRateId(e.target.value)}
                        placeholder="Enter interest rate"
                        disabled={!pinVerified}
                      />
                    </FormGroup>
                  </div>
                  <div className="col-12 col-sm-6">
                    <FormGroup id="periodMonths" label="Period (months)">
                      <Select ariaLabel="Period" value={periodMonths} onChange={() => {}} disabled>
                        {[3, 6, 9, 12, 18, 24].map((m) => <Option key={m} value={String(m)}>{`${m} months`}</Option>)}
                      </Select>
                    </FormGroup>
                  </div>
                  <div className="col-12 col-sm-6">
                    <FormGroup id="maturityDate" label="Maturity Date">
                      <Input type="text" value={maturityDate} disabled />
                    </FormGroup>
                  </div>
                  <div className="col-12">
                    <FormGroup id="remarks" label="Remarks / Notes">
                      <Textarea value={remarks} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)} placeholder="Add notes, payment details, or any other information..." rows={4} />
                    </FormGroup>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button color="dark" isLight className="flex-grow-1" onClick={() => navigate("/transactions")} isDisable={loading}>
                    Cancel
                  </Button>
                  <Button color="primary" className="flex-grow-1" onClick={handleSubmit} isDisable={loading}>
                    {loading ? "Updating..." : "Update Transaction"}
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
