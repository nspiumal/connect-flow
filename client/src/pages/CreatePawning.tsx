import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import Alert from "@/vendor/facit/components/bootstrap/Alert";
import Icon from "@/vendor/facit/components/icon/Icon";
import { FormModal } from "@/components/facit/FormModal";
import NumberInput from "@/components/facit/NumberInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { notify } from "@/components/facit/notify";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/integrations/api";
import { AddItemTypeDialog } from "@/components/AddItemTypeDialog";
import { formatAmount, formatWeight } from "@/lib/utils";

interface Rate {
  id: string;
  name: string;
  rate_percent?: number;
  ratePercent?: number;
  firstMonthRatePercent?: number;
  isDefault?: boolean;
}

interface ItemType {
  id: string;
  name: string;
}

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: string;
  appraisedValue: number;
  marketValue: number;
  images: string[];
}

export default function CreatePawning() {
  const { role, user, branchId } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Customer verification & details
  const [nicInput, setNicInput] = useState("");
  const [nicVerified, setNicVerified] = useState(false);
  const [nicVerifying, setNicVerifying] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocklistReason, setBlocklistReason] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [idType, setIdType] = useState("NIC");
  const [gender, setGender] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: Item information
  const [itemDescription, setItemDescription] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCondition, setItemCondition] = useState("Good");
  const [itemWeight, setItemWeight] = useState("");
  const [itemKarat, setItemKarat] = useState("N/A");
  const [appraisedValue, setAppraisedValue] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [currentItemImages, setCurrentItemImages] = useState<string[]>([]);

  const [items, setItems] = useState<ItemDetail[]>([]);

  // Step 3: Transaction details
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("12");
  const [remarks, setRemarks] = useState("");
  const [manualRateEnabled, setManualRateEnabled] = useState(false);
  const [manualRatePercent, setManualRatePercent] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const [managerUserId, setManagerUserId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddItemTypeDialog, setShowAddItemTypeDialog] = useState(false);

  // Hidden feature: T-N-D key sequence for revealing period field
  const [showPeriodField, setShowPeriodField] = useState(false);
  const keySequenceRef = useRef<string[]>([]);
  const keyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);

      if (data && data.length > 0) {
        const defaultRate = data.find((rate: Rate) => rate.isDefault);
        setSelectedRateId(defaultRate ? defaultRate.id : data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      notify({ title: "Error", description: "Failed to load interest rates", variant: "destructive" });
    }
  };

  const fetchItemTypes = async () => {
    try {
      const data = await apiClient.itemTypes.getAll();
      setItemTypes(data || []);
    } catch (error) {
      console.error("Failed to fetch item types:", error);
      const message = error instanceof Error ? `: ${error.message}` : "";
      notify({ title: "Warning", description: `Failed to load item types${message}. Using default options.`, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchRates();
    fetchItemTypes();
  }, []);

  // Hidden feature: T-N-D key sequence to reveal period field
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["t", "n", "d"].includes(key)) {
        keySequenceRef.current.push(key);
        if (keyTimerRef.current) clearTimeout(keyTimerRef.current);

        if (keySequenceRef.current.length >= 3) {
          const lastThree = keySequenceRef.current.slice(-3).join("");
          if (lastThree === "tnd") {
            setShowPeriodField((prev) => {
              notify({ title: prev ? "Period Field Hidden" : "Period Field Revealed", description: prev ? "Period field is now hidden" : "Type T-N-D again to hide" });
              return !prev;
            });
            keySequenceRef.current = [];
          }
        }

        keyTimerRef.current = setTimeout(() => {
          keySequenceRef.current = [];
        }, 3000);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (keyTimerRef.current) clearTimeout(keyTimerRef.current);
    };
  }, []);

  // Auto-fill loan amount from total appraised value
  useEffect(() => {
    const totalAppraisedValue = items.reduce((sum, item) => sum + item.appraisedValue, 0);
    setLoanAmount(items.length > 0 ? totalAppraisedValue.toFixed(2) : "");
  }, [items]);

  const handleVerifyNic = async () => {
    if (!nicInput.trim()) {
      setErrors({ ...errors, nic: "Please enter NIC number" });
      return;
    }

    try {
      setNicVerifying(true);
      setErrors({});

      const response = await apiClient.blacklist.verifyNic(nicInput.trim());

      if (response.isBlocked) {
        setIsBlocked(true);
        setBlocklistReason(response.blocklistReason);
        setNicVerified(false);
        notify({ title: "Customer Blocked", description: `This customer is blocked: ${response.blocklistReason}`, variant: "destructive" });
      } else {
        setIsBlocked(false);
        setBlocklistReason("");
        setNicVerified(true);
        setCustomerNic(nicInput.trim());

        if (response.customer) {
          setCustomerName(response.customer.fullName || "");
          setCustomerPhone(response.customer.phone || "");
          setCustomerAddress(response.customer.address || "");
          notify({ title: "Customer Found", description: "Customer details have been auto-filled. You can edit them if needed." });
        } else {
          setCustomerName("");
          setCustomerPhone("");
          setCustomerAddress("");
          notify({ title: "NIC Verified", description: "No existing customer record. Please enter customer details." });
        }
      }
    } catch (error) {
      console.error("Failed to verify NIC:", error);
      const message = error instanceof Error ? error.message : "Failed to verify NIC";
      notify({ title: "Verification Failed", description: message, variant: "destructive" });
    } finally {
      setNicVerifying(false);
    }
  };

  const handleStep1Next = () => {
    const newErrors: Record<string, string> = {};

    if (!nicVerified) newErrors.nic = "Please verify NIC first";
    if (!customerName.trim()) newErrors.customerName = "Customer name is required";
    if (!gender) newErrors.gender = "Gender is required";
    if (!customerAddress.trim()) newErrors.customerAddress = "Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setErrors({});
    setCurrentStep(2);
  };

  const handleAddItem = () => {
    const newErrors: Record<string, string> = {};

    if (!itemWeight || parseFloat(itemWeight) <= 0) newErrors.itemWeight = "Weight is required and must be greater than 0";
    if (!appraisedValue || parseFloat(appraisedValue) <= 0) newErrors.appraisedValue = "Appraised value is required and must be greater than 0";
    if (!marketValue || parseFloat(marketValue) <= 0) newErrors.marketValue = "Market value is required and must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newItem: ItemDetail = {
      description: itemDescription || "Item",
      content: itemContent,
      condition: itemCondition,
      weightGrams: parseFloat(itemWeight),
      karat: itemKarat,
      appraisedValue: parseFloat(appraisedValue),
      marketValue: parseFloat(marketValue),
      images: currentItemImages,
    };

    setItems([...items, newItem]);

    setItemDescription("");
    setItemContent("");
    setItemCondition("Good");
    setItemWeight("");
    setItemKarat("N/A");
    setAppraisedValue("");
    setMarketValue("");
    setCurrentItemImages([]);
    setErrors({});

    notify({ title: "Item Added", description: "Item added successfully" });
  };

  const handleStep2Next = () => {
    if (items.length === 0) {
      notify({ title: "Validation Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }
    setCurrentStep(3);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentItemImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setCurrentItemImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resolveManagerUserId = async () => {
    if (role === "MANAGER" && user?.id) return user.id;

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

  const handleManualRateToggle = async () => {
    if (manualRateEnabled) {
      setManualRateEnabled(false);
      setManualRatePercent("");
      return;
    }

    if (role !== "MANAGER" && role !== "STAFF") {
      notify({ title: "Not Allowed", description: "Only branch managers or staff can enable manual rates", variant: "destructive" });
      return;
    }

    const resolvedManagerId = await resolveManagerUserId();
    if (!resolvedManagerId) return;
    setManagerUserId(resolvedManagerId);
    setPinInput("");
    setShowPinDialog(true);
  };

  const handleVerifyPin = async () => {
    if (!managerUserId || !pinInput.trim()) {
      notify({ title: "Validation Error", description: "Please enter manager PIN", variant: "destructive" });
      return;
    }

    try {
      setPinVerifying(true);
      await apiClient.users.verifyPin(managerUserId, pinInput.trim());
      setManualRateEnabled(true);
      setShowPinDialog(false);
      notify({ title: "Success", description: "Manual rate enabled", variant: "success" });
    } catch (error) {
      console.error("PIN verification failed:", error);
      notify({ title: "Invalid PIN", description: "Branch manager PIN is incorrect", variant: "destructive" });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleStep3Submit = () => {
    const newErrors: Record<string, string> = {};

    if (!manualRateEnabled && !selectedRateId) newErrors.interestRate = "Please select an interest rate";
    if (manualRateEnabled && !manualRatePercent) newErrors.manualRate = "Please enter the manual interest rate";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setErrors({});
    setShowSummary(true);
  };

  const selectedRate = rates.find((r) => r.id === selectedRateId);
  const effectiveRatePercent = manualRateEnabled ? parseFloat(manualRatePercent || "0") : selectedRate?.rate_percent || selectedRate?.ratePercent || 0;
  const firstMonthRatePercent = manualRateEnabled ? effectiveRatePercent / 12 : selectedRate?.firstMonthRatePercent || effectiveRatePercent / 12;

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const pawnDate = today.toISOString().split("T")[0];
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths, 10));
      const maturityDateStr = maturityDate.toISOString().split("T")[0];

      const totalWeight = items.reduce((sum, item) => sum + item.weightGrams, 0);
      const totalAppraisedValue = items.reduce((sum, item) => sum + item.appraisedValue, 0);
      const allImages = items.flatMap((item) => item.images);

      const itemDescriptionSummary = items.length > 1 ? `Multiple items (${items.length} items)` : items[0]?.description || "";

      const transactionData = {
        customerName,
        customerNic,
        idType,
        gender,
        customerAddress,
        customerPhone,
        customerType: "Regular",
        itemDescription: itemDescriptionSummary,
        itemContent: items[0]?.content || "",
        itemCondition: items[0]?.condition || "Good",
        itemWeightGrams: totalWeight,
        itemKarat: items[0]?.karat || "N/A",
        appraisedValue: totalAppraisedValue,
        loanAmount: parseFloat(loanAmount),
        interestRateId: manualRateEnabled ? null : selectedRateId,
        interestRatePercent: effectiveRatePercent,
        firstMonthInterestRatePercent: firstMonthRatePercent,
        periodMonths: parseInt(periodMonths, 10),
        pawnDate,
        maturityDate: maturityDateStr,
        remarks,
        imageUrls: allImages,
        items,
      };

      const response = await apiClient.pawnTransactions.create(transactionData);

      notify({ title: "Success", description: `Pawning transaction created successfully! Receipt No: ${response.pawnId || response.pawn_id}`, variant: "success" });

      setShowSummary(false);
      navigate("/transactions");
    } catch (error) {
      console.error("Failed to create transaction:", error);
      const message = error instanceof Error ? error.message : "Failed to create transaction";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setNicInput("");
    setNicVerified(false);
    setIsBlocked(false);
    setCustomerName("");
    setCustomerNic("");
    setGender("");
    setCustomerAddress("");
    setCustomerPhone("");
    setItems([]);
    setCurrentItemImages([]);
    setLoanAmount("");
    setSelectedRateId("");
    setRemarks("");
    setManualRateEnabled(false);
    setManualRatePercent("");
    setErrors({});
  };

  const enterKeyHandler = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  const stepLabel = (step: number) => (step === 1 ? "Customer" : step === 2 ? "Items" : "Transaction");

  return (
    <PageWrapper title="Create New Pawning Transaction">
      <LoadingOverlay isLoading={loading} />
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Pawn Transactions", to: "/transactions" }, { title: "New Transaction", to: "/transactions/create-new" }]} />
        </SubHeaderLeft>
      </SubHeader>
      <Page>
        <p className="text-muted small mb-4">Complete the 3-step wizard to create a transaction</p>

        {/* Progress Indicator */}
        <div className="d-flex align-items-center justify-content-between mx-auto mb-4" style={{ maxWidth: 560 }}>
          {[1, 2, 3].map((step) => (
            <div key={step} className="d-flex align-items-center flex-grow-1">
              <div className="d-flex flex-column align-items-center">
                <div
                  className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${
                    currentStep === step ? "bg-primary text-white" : currentStep > step ? "bg-success text-white" : "bg-body-tertiary text-muted"
                  }`}
                  style={{ width: 40, height: 40 }}
                >
                  {currentStep > step ? <Icon icon="CheckCircle" /> : step}
                </div>
                <span className="small fw-medium mt-1">{stepLabel(step)}</span>
              </div>
              {step < 3 && <div className={`flex-grow-1 mx-2 ${currentStep > step ? "bg-success" : "bg-body-tertiary"}`} style={{ height: 4 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Customer Verification & Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="fs-6">Step 1: Customer Verification &amp; Details</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="pb-4 mb-4 border-bottom">
                <label htmlFor="nicInput" className="form-label small fw-medium">
                  NIC Number <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2">
                  <Input
                    id="nicInput"
                    value={nicInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNicInput(e.target.value)}
                    onKeyDown={enterKeyHandler(() => { if (!nicVerified) handleVerifyNic(); })}
                    placeholder="Enter NIC number and press Enter or click Verify"
                    disabled={nicVerified}
                    isValid={!errors.nic}
                    isTouched={!!errors.nic}
                    invalidFeedback={errors.nic}
                  />
                  <Button color="primary" onClick={handleVerifyNic} isDisable={nicVerifying || nicVerified} className="text-nowrap">
                    {nicVerifying ? "Verifying..." : nicVerified ? "Verified" : "Verify"}
                  </Button>
                </div>

                {isBlocked && (
                  <Alert color="danger" icon="Error" className="mt-3">
                    <strong>Customer Blocked:</strong> {blocklistReason}
                  </Alert>
                )}

                {nicVerified && !isBlocked && (
                  <Alert color="success" icon="CheckCircle" className="mt-3">
                    NIC verified successfully. Please fill in or update customer details below.
                  </Alert>
                )}
              </div>

              {nicVerified && !isBlocked && (
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <FormGroup id="customerName" label="Customer Name *">
                      <Input
                        value={customerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                        onKeyDown={enterKeyHandler(handleStep1Next)}
                        placeholder="Enter customer name"
                        isValid={!errors.customerName}
                        isTouched={!!errors.customerName}
                        invalidFeedback={errors.customerName}
                      />
                    </FormGroup>
                  </div>

                  <div className="col-12 col-md-6">
                    <FormGroup id="gender" label="Gender *">
                      <Select ariaLabel="Gender" value={gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)} placeholder="Select gender">
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                      {errors.gender && <p className="text-danger small mt-1 mb-0">{errors.gender}</p>}
                    </FormGroup>
                  </div>

                  <div className="col-12 col-md-6">
                    <FormGroup id="customerPhone" label="Phone Number">
                      <Input value={customerPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)} onKeyDown={enterKeyHandler(handleStep1Next)} placeholder="Enter phone number" />
                    </FormGroup>
                  </div>

                  <div className="col-12 col-md-6">
                    <FormGroup id="idType" label="ID Type">
                      <Select ariaLabel="ID Type" value={idType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdType(e.target.value)}>
                        <Option value="NIC">National Identity Card (NIC)</Option>
                        <Option value="Passport">Passport</Option>
                        <Option value="DrivingLicense">Driving License</Option>
                      </Select>
                    </FormGroup>
                  </div>

                  <div className="col-12">
                    <FormGroup id="customerAddress" label="Address *">
                      <Input
                        value={customerAddress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerAddress(e.target.value)}
                        onKeyDown={enterKeyHandler(handleStep1Next)}
                        placeholder="Enter address"
                        isValid={!errors.customerAddress}
                        isTouched={!!errors.customerAddress}
                        invalidFeedback={errors.customerAddress}
                      />
                    </FormGroup>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 pt-4">
                <Button color="dark" isLight onClick={() => navigate("/transactions")}>
                  Cancel
                </Button>
                <Button color="primary" icon="ArrowForward" onClick={handleStep1Next} isDisable={!nicVerified || isBlocked}>
                  Next: Add Items
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Item Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="d-flex align-items-center justify-content-between w-100">
                <CardTitle className="fs-6">Step 2: Item Information</CardTitle>
                <span className="small text-muted">{items.length} item(s) added</span>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="row g-3">
                <div className="col-12">
                  <FormGroup id="itemDescription" label="Item Description (Optional)">
                    <Textarea value={itemDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemDescription(e.target.value)} placeholder="Describe the gold item (optional)" rows={2} />
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center justify-content-between">
                    <label htmlFor="itemContent" className="form-label small mb-0">Item Type</label>
                    <Button color="primary" isLink className="p-0" icon="AddCircle" onClick={() => setShowAddItemTypeDialog(true)}>
                      Quick Add
                    </Button>
                  </div>
                  <Select id="itemContent" ariaLabel="Item Type" value={itemContent} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemContent(e.target.value)} placeholder="Select item type">
                    {itemTypes.length > 0 ? (
                      itemTypes.map((type) => <Option key={type.id} value={type.name}>{type.name}</Option>)
                    ) : (
                      <>
                        <Option value="Ring">Ring</Option>
                        <Option value="Chain">Chain</Option>
                        <Option value="Bracelet">Bracelet</Option>
                        <Option value="Earrings">Earrings</Option>
                        <Option value="Necklace">Necklace</Option>
                        <Option value="Bangle">Bangle</Option>
                        <Option value="Pendant">Pendant</Option>
                        <Option value="Coin">Coin</Option>
                        <Option value="Bar">Bar/Ingot</Option>
                        <Option value="Other">Other</Option>
                      </>
                    )}
                  </Select>
                  <p className="text-muted small mt-1 mb-0">{itemTypes.length > 0 ? `${itemTypes.length} item types available from database` : "Loading item types from database..."}</p>
                </div>

                <div className="col-12 col-md-6">
                  <FormGroup id="itemCondition" label="Condition">
                    <Select ariaLabel="Condition" value={itemCondition} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemCondition(e.target.value)}>
                      <Option value="Excellent">Excellent</Option>
                      <Option value="Good">Good</Option>
                      <Option value="Fair">Fair</Option>
                      <Option value="Poor">Poor</Option>
                    </Select>
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <FormGroup id="itemWeight" label="Weight (grams) *">
                    <NumberInput id="itemWeight" value={itemWeight} onChange={setItemWeight} onKeyDown={enterKeyHandler(handleAddItem)} precision={3} placeholder="Enter weight" />
                    {errors.itemWeight && <p className="text-danger small mt-1 mb-0">{errors.itemWeight}</p>}
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <FormGroup id="itemKarat" label="Karat">
                    <Select ariaLabel="Karat" value={itemKarat} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemKarat(e.target.value)}>
                      <Option value="N/A">N/A</Option>
                      <Option value="10K">10K Gold</Option>
                      <Option value="14K">14K Gold</Option>
                      <Option value="18K">18K Gold</Option>
                      <Option value="22K">22K Gold</Option>
                      <Option value="24K">24K Gold</Option>
                    </Select>
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <FormGroup id="appraisedValue" label="Appraised Value (LKR) *">
                    <Input
                      type="number"
                      step={0.01}
                      value={appraisedValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppraisedValue(e.target.value)}
                      onKeyDown={enterKeyHandler(handleAddItem)}
                      placeholder="Loan-eligible value"
                      isValid={!errors.appraisedValue}
                      isTouched={!!errors.appraisedValue}
                      invalidFeedback={errors.appraisedValue}
                    />
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <FormGroup id="marketValue" label="Market Value (LKR) *">
                    <Input
                      type="number"
                      step={0.01}
                      value={marketValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketValue(e.target.value)}
                      onKeyDown={enterKeyHandler(handleAddItem)}
                      placeholder="Market/replacement value"
                      isValid={!errors.marketValue}
                      isTouched={!!errors.marketValue}
                      invalidFeedback={errors.marketValue}
                    />
                  </FormGroup>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label small d-flex align-items-center gap-2">Item Images (Optional)</label>
                <div className="d-flex align-items-center gap-3">
                  <Button color="dark" isLight icon="Upload" onClick={() => document.getElementById("image-upload")?.click()}>
                    Upload Images
                  </Button>
                  <input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="d-none" />
                  <span className="text-muted small">{currentItemImages.length} image(s)</span>
                </div>

                {currentItemImages.length > 0 && (
                  <div className="row g-2 mt-1">
                    {currentItemImages.map((preview, index) => (
                      <div key={index} className="col-6 col-md-3 position-relative">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-100 rounded border" style={{ height: 96, objectFit: "cover" }} />
                        <Button color="danger" size="sm" className="position-absolute top-0 end-0 m-1" icon="Close" onClick={() => removeImage(index)} aria-label="Remove image" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end mt-3">
                <Button color="primary" icon="Add" onClick={handleAddItem}>
                  Add Item
                </Button>
              </div>

              {items.length > 0 && (
                <div className="pt-3 mt-3 border-top">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">Added Items ({items.length})</label>
                    <span className="text-muted small">Total: LKR {formatAmount(items.reduce((s, i) => s + i.appraisedValue, 0))}</span>
                  </div>

                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 240, overflowY: "auto" }}>
                    {items.map((item, index) => (
                      <div key={index} className="d-flex align-items-start gap-3 p-3 bg-body-tertiary rounded border">
                        <div className="flex-grow-1">
                          <p className="small fw-medium mb-1">Item {index + 1}: {item.description || "Item"}</p>
                          <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: "0.75rem" }}>
                            <span>{item.content || "N/A"}</span>
                            <span>{item.condition}</span>
                            <span>{item.weightGrams}g</span>
                            <span>{item.karat}</span>
                            <span>LKR {formatAmount(item.appraisedValue)}</span>
                            <span>{item.images.length} img(s)</span>
                          </div>
                        </div>
                        <Button color="danger" isLight size="sm" icon="Delete" onClick={() => handleRemoveItem(index)} aria-label="Remove item" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between pt-4">
                <Button color="dark" isLight onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button color="primary" icon="ArrowForward" onClick={handleStep2Next} isDisable={items.length === 0}>
                  Next: Transaction Details
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 3: Transaction Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="fs-6">Step 3: Transaction Confirmation</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="row g-3 p-3 bg-body-tertiary rounded mb-3">
                <div className="col-12 col-md-6">
                  <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Customer</p>
                  <p className="fw-medium mb-0">{customerName}</p>
                  <p className="text-muted small mb-0">{customerNic}</p>
                </div>
                <div className="col-12 col-md-6">
                  <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Items</p>
                  <p className="fw-medium mb-0">{items.length} item(s)</p>
                  <p className="text-muted small mb-0">Total: LKR {formatAmount(items.reduce((s, i) => s + i.appraisedValue, 0))}</p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <FormGroup id="loanAmount" label="Loan Amount (LKR)" formText="Auto-calculated from items">
                    <Input type="number" value={loanAmount} readOnly disabled />
                  </FormGroup>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="form-label small mb-0">Interest Rate <span className="text-danger">*</span></label>
                    <Button color="dark" isLight size="sm" onClick={handleManualRateToggle}>
                      {manualRateEnabled ? "Disable Manual" : "Enable Manual"}
                    </Button>
                  </div>
                  <Select
                    ariaLabel="Interest Rate"
                    value={selectedRateId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRateId(e.target.value)}
                    disabled={manualRateEnabled}
                    placeholder="Select interest rate"
                    isValid={!errors.interestRate}
                    isTouched={!!errors.interestRate}
                  >
                    {rates.map((r) => (
                      <Option key={r.id} value={r.id}>{`${r.name} - ${r.rate_percent || r.ratePercent}% per Month`}</Option>
                    ))}
                  </Select>
                  {manualRateEnabled && (
                    <Input
                      type="number"
                      step={0.01}
                      value={manualRatePercent}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualRatePercent(e.target.value)}
                      onKeyDown={enterKeyHandler(handleStep3Submit)}
                      placeholder="Enter interest rate (%)"
                      className="mt-2"
                      isValid={!errors.manualRate}
                      isTouched={!!errors.manualRate}
                    />
                  )}
                  {errors.interestRate && <p className="text-danger small mt-1 mb-0">{errors.interestRate}</p>}
                  {errors.manualRate && <p className="text-danger small mt-1 mb-0">{errors.manualRate}</p>}
                </div>

                {showPeriodField && (
                  <div className="col-12 col-md-6">
                    <FormGroup id="periodMonths" label="Period (months)">
                      <Select ariaLabel="Period" value={periodMonths} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriodMonths(e.target.value)}>
                        {[3, 6, 9, 12, 18, 24].map((m) => <Option key={m} value={String(m)}>{`${m} months`}</Option>)}
                      </Select>
                    </FormGroup>
                  </div>
                )}

                <div className="col-12">
                  <FormGroup id="remarks" label="Remarks">
                    <Textarea value={remarks} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)} onKeyDown={enterKeyHandler(handleStep3Submit)} placeholder="Add any additional notes" rows={3} />
                  </FormGroup>
                </div>
              </div>

              <div className="d-flex justify-content-between pt-4">
                <div className="d-flex gap-2">
                  <Button color="dark" isLight onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button color="dark" isLight onClick={handleReset}>
                    Reset All
                  </Button>
                </div>
                <Button color="primary" onClick={handleStep3Submit}>
                  Create Transaction
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </Page>

      {/* PIN Dialog */}
      <FormModal isOpen={showPinDialog} setIsOpen={setShowPinDialog} title="Manager PIN Required" onSubmit={handleVerifyPin} isSubmitting={pinVerifying} submitLabel="Verify PIN" size="sm">
        <FormGroup id="managerPin" label="Branch Manager PIN">
          <Input type="password" value={pinInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPinInput(e.target.value)} placeholder="Enter PIN" />
        </FormGroup>
      </FormModal>

      {/* Summary Dialog */}
      <FormModal isOpen={showSummary} setIsOpen={setShowSummary} title="Transaction Summary" onSubmit={handleConfirmSubmit} isSubmitting={loading} submitLabel="Confirm & Create" size="lg">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Customer</p>
            <p className="fw-medium mb-0">{customerName}</p>
            <p className="text-muted small mb-0">{customerNic}</p>
            <p className="text-muted small mb-0">{customerAddress}</p>
          </div>
          <div className="col-12 col-md-6">
            <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Loan Amount</p>
            <p className="fw-medium mb-0">LKR {formatAmount(loanAmount || 0)}</p>
            <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Interest Rate</p>
            <p className="small mb-0">{manualRateEnabled ? "Manual" : selectedRate?.name || "-"} - {effectiveRatePercent}% per annum</p>
            <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Period</p>
            <p className="small mb-0">{periodMonths} months</p>
          </div>
        </div>

        <div className="rounded border p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="fw-medium mb-0">Items ({items.length})</p>
            <p className="text-muted small mb-0">Total: LKR {formatAmount(items.reduce((s, i) => s + i.appraisedValue, 0))}</p>
          </div>
          <div className="d-flex flex-column gap-2">
            {items.map((item, index) => (
              <div key={index} className="rounded bg-body-tertiary p-2">
                <p className="small fw-medium mb-0">Item {index + 1}: {item.description || "Item"}</p>
                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                  {item.content || "N/A"} | {item.condition} | {formatWeight(item.weightGrams)}g | {item.karat} | Appraised: LKR {formatAmount(item.appraisedValue)} | Market: LKR {formatAmount(item.marketValue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {remarks && (
          <div className="rounded border p-3">
            <p className="text-muted mb-1" style={{ fontSize: "0.75rem" }}>Remarks</p>
            <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>{remarks}</p>
          </div>
        )}
      </FormModal>

      <AddItemTypeDialog
        open={showAddItemTypeDialog}
        onOpenChange={setShowAddItemTypeDialog}
        onSuccess={(newItemType) => {
          fetchItemTypes();
          setItemContent(newItemType.name);
        }}
      />
    </PageWrapper>
  );
}
