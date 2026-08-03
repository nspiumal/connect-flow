import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatAmount, formatWeight } from "@/lib/utils";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import Checks from "@/vendor/facit/components/bootstrap/forms/Checks";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import { FormModal } from "@/components/facit/FormModal";
import NumberInput from "@/components/facit/NumberInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { AddItemTypeDialog } from "@/components/AddItemTypeDialog";

type IdType = "NIC" | "Passport" | "DrivingLicense" | "Other";

const ID_TYPE_LABELS: Record<IdType, string> = {
  NIC: "NIC",
  Passport: "Passport",
  DrivingLicense: "Driving License",
  Other: "ID Number",
};

type Rate = {
  id: string;
  name: string;
  ratePercent?: number;
  rate_percent?: number;
  firstMonthRatePercent?: number;
  isDefault?: boolean;
};

interface ItemDraft {
  description: string;
  content: string;
  condition: string;
  weight: string;
  karat: string;
  appraisedValue: string;
  marketValue: string;
  images: string[];
}

interface ItemPayload {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: string;
  appraisedValue: number;
  marketValue: number;
  images: string[];
}

interface Customer {
  id: string;
  fullName: string;
  nic: string;
  phone?: string;
  address?: string;
  gender?: string;
}

interface ItemType {
  id: string;
  name: string;
}

const emptyItemDraft: ItemDraft = {
  description: "",
  content: "",
  condition: "Good",
  weight: "",
  karat: "22K",
  appraisedValue: "",
  marketValue: "",
  images: [],
};

export default function CreatePawningSample() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [gender, setGender] = useState("");
  const [idType, setIdType] = useState<IdType>("NIC");
  const [identityVerifying, setIdentityVerifying] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  // Special pattern unlock
  const [specialPattern, setSpecialPattern] = useState("TND");
  const [patternUnlocked, setPatternUnlocked] = useState(false);
  const [patternBuffer, setPatternBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Item draft + list
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [items, setItems] = useState<ItemPayload[]>([]);

  // Transaction fields
  const [selectedRateId, setSelectedRateId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [periodMonths, setPeriodMonths] = useState("12");

  // Manager override for interest rate
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const [rateOverrideEnabled, setRateOverrideEnabled] = useState(false);
  const [manualInterestRate, setManualInterestRate] = useState("");

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddItemTypeDialog, setShowAddItemTypeDialog] = useState(false);

  // Customer search dropdown state
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectingCustomerRef = useRef(false);
  const skipNextAutoSearchRef = useRef(false);
  const selectedNicRef = useRef<string | null>(null);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc.weight += item.weightGrams;
          acc.appraised += item.appraisedValue;
          acc.market += item.marketValue;
          return acc;
        },
        { weight: 0, appraised: 0, market: 0 }
      ),
    [items]
  );

  const identityLabel = ID_TYPE_LABELS[idType];

  const fetchRatesCallback = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);

      if (data && data.length > 0) {
        const defaultRate = data.find((rate: Rate) => rate.isDefault);
        setSelectedRateId(defaultRate ? defaultRate.id : data[0].id);
      }
    } catch (error) {
      notify({ title: "Error", description: "Failed to load interest rates", variant: "destructive" });
    }
  };

  const fetchItemTypes = async () => {
    try {
      const data = await apiClient.itemTypes.getAll();
      setItemTypes(data || []);
    } catch (error) {
      console.error("Failed to fetch item types:", error);
      notify({ title: "Warning", description: `Failed to load item types${error instanceof Error ? `: ${error.message}` : ""}. Using default options.`, variant: "destructive" });
    }
  };

  const fetchPatternConfig = async () => {
    try {
      const data = await apiClient.pawnTransactions.getPatternConfig();
      if (data?.pattern && typeof data.pattern === "string") {
        setSpecialPattern(data.pattern);
      }
    } catch {
      setSpecialPattern("TND");
    }
  };

  useEffect(() => {
    fetchRatesCallback();
    fetchItemTypes();
    fetchPatternConfig();
  }, []);

  useEffect(() => {
    // Skip reset when identity is changed by selecting from dropdown
    if (selectingCustomerRef.current) {
      selectingCustomerRef.current = false;
      return;
    }
    setIdentityVerified(false);
    setCustomerFound(false);
    setBlockedReason(null);
  }, [idType, identityNumber]);

  useEffect(() => {
    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      setShowCustomerDropdown(false);
      setCustomerSearchResults([]);
      return;
    }

    if (
      idType === "NIC" &&
      identityVerified &&
      customerFound &&
      selectedNicRef.current &&
      selectedNicRef.current === identityNumber.trim()
    ) {
      setShowCustomerDropdown(false);
      setCustomerSearchResults([]);
      return;
    }

    if (idType !== "NIC" || identityNumber.length < 5) {
      setShowCustomerDropdown(false);
      setCustomerSearchResults([]);
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
      return;
    }

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    const timer = setTimeout(async () => {
      try {
        setIdentityVerifying(true);

        const result = await apiClient.blacklist.verifyNic(identityNumber.trim());

        if (result?.isBlocked) {
          setShowCustomerDropdown(false);
          setBlockedReason(result.blocklistReason || "Customer is blocked");
          setIdentityVerifying(false);
          return;
        }

        const searchResult = await apiClient.customers.search(identityNumber.trim(), 0, 10);
        const customers = searchResult?.content || [];

        if (customers.length > 0) {
          setCustomerSearchResults(customers);
          setShowCustomerDropdown(true);
        } else {
          setShowCustomerDropdown(false);
          setCustomerSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
      } finally {
        setIdentityVerifying(false);
      }
    }, 500);

    searchDebounceTimerRef.current = timer;

    return () => clearTimeout(timer);
  }, [identityNumber, idType, identityVerified, customerFound]);

  const handleSelectCustomer = (customer: Customer) => {
    selectingCustomerRef.current = true;
    skipNextAutoSearchRef.current = true;
    selectedNicRef.current = customer.nic || null;

    setIdentityNumber(customer.nic || "");
    setCustomerName(customer.fullName || "");
    setCustomerPhone(customer.phone || "");
    setCustomerAddress(customer.address || "");
    setGender(customer.gender || "");
    setCustomerFound(true);
    setIdentityVerified(true);
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Stealth pattern unlock — a filterable admin easter egg, not a security boundary
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      const currentTime = Date.now();
      const key = e.key.toUpperCase();

      if (currentTime - lastKeyTime > 2000) {
        setPatternBuffer(key);
      } else {
        setPatternBuffer((prev) => prev + key);
      }
      setLastKeyTime(currentTime);

      const newBuffer = currentTime - lastKeyTime > 2000 ? key : patternBuffer + key;
      if (newBuffer.length >= specialPattern.length) {
        const lastChars = newBuffer.slice(-specialPattern.length);
        if (lastChars === specialPattern.toUpperCase()) {
          setPatternUnlocked(true);
          setPatternBuffer("");
          notify({ title: "Special Mode Enabled", description: "Period selection unlocked" });
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [lastKeyTime, patternBuffer, specialPattern]);

  const updateDraft = (patch: Partial<ItemDraft>) => {
    setItemDraft((prev) => ({ ...prev, ...patch }));
  };

  const playSuccessSound = () => {
    const audio = new Audio("/success-beep.mp3");
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  const handleRequestRateOverride = () => {
    setShowPinDialog(true);
    setManagerPin("");
  };

  const handleVerifyManagerPin = async () => {
    if (!managerPin.trim()) {
      notify({ title: "Error", description: "Please enter PIN", variant: "destructive" });
      return;
    }

    try {
      setPinVerifying(true);

      const currentUserEmail = localStorage.getItem("userEmail") || "";
      if (!currentUserEmail) {
        notify({ title: "Error", description: "User email not found", variant: "destructive" });
        return;
      }

      await apiClient.users.verifyManagerPin(currentUserEmail, managerPin, "Interest Rate Override - Transaction Creation");

      playSuccessSound();
      setRateOverrideEnabled(true);
      setShowPinDialog(false);
      setManualInterestRate("");

      notify({ title: "Override Enabled", description: "You can now manually enter the interest rate (0.1% - 50%)", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify PIN";
      notify({ title: "Invalid PIN", description: message, variant: "destructive" });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setItemDraft((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  };

  const removeDraftImage = (index: number) => {
    setItemDraft((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const validateIdentity = (type: IdType, value: string): string | null => {
    const v = value.trim();
    if (!v) return "Identity number is required";

    if (type === "NIC") {
      const nicRegex = /^(?:\d{9}[VvXx]|\d{11,12})$/;
      if (!nicRegex.test(v)) return "NIC must be 9 digits + V/X or 11-12 digits";
      return null;
    }

    if (type === "Passport") {
      const passportRegex = /^[A-Za-z0-9]{6,12}$/;
      if (!passportRegex.test(v)) return "Passport must be 6-12 alphanumeric characters";
      return null;
    }

    if (type === "Other") {
      if (v.length < 4 || v.length > 30) return "ID number must be 4-30 characters";
      return null;
    }

    const licenseRegex = /^[A-Za-z0-9-]{6,15}$/;
    if (!licenseRegex.test(v)) return "Driving License must be 6-15 characters (letters, numbers, hyphen)";
    return null;
  };

  const handleVerifyIdentity = async () => {
    const identityError = validateIdentity(idType, identityNumber);
    if (identityError) {
      notify({ title: "Validation Error", description: identityError, variant: "destructive" });
      return;
    }

    try {
      setIdentityVerifying(true);
      setBlockedReason(null);

      const identity = identityNumber.trim();

      if (idType === "NIC") {
        const result = await apiClient.blacklist.verifyNic(identity);

        if (result?.isBlocked) {
          setIdentityVerified(false);
          setBlockedReason(result.blocklistReason || "Customer is blocked");
          notify({ title: "Blocked Customer", description: result.blocklistReason || "This customer is blocked", variant: "destructive" });
          return;
        }

        if (result?.customer) {
          setCustomerName(result.customer.fullName || "");
          setCustomerPhone(result.customer.phone || "");
          setCustomerAddress(result.customer.address || "");
          setCustomerFound(true);
        } else {
          setCustomerFound(false);
        }

        setIdentityVerified(true);
        notify({ title: "Identity Verified", description: result?.customer ? "Customer auto-filled from database" : "No existing customer found. Enter details manually." });
        return;
      }

      try {
        const customer = await apiClient.customers.getByNic(identity);
        setCustomerName(customer.fullName || "");
        setCustomerPhone(customer.phone || "");
        setCustomerAddress(customer.address || "");
        setCustomerFound(true);
        notify({ title: "Identity Verified", description: "Customer auto-filled from database" });
      } catch {
        setCustomerFound(false);
        notify({ title: "Identity Verified", description: "No existing customer found. Enter details manually." });
      }

      setIdentityVerified(true);
    } catch (error) {
      notify({ title: "Verification Error", description: "Failed to verify identity", variant: "destructive" });
    } finally {
      setIdentityVerifying(false);
    }
  };

  const handleAddItem = () => {
    if (!itemDraft.weight || parseFloat(itemDraft.weight) <= 0) {
      notify({ title: "Validation Error", description: "Please enter valid item weight", variant: "destructive" });
      return;
    }
    if (!itemDraft.appraisedValue || parseFloat(itemDraft.appraisedValue) <= 0) {
      notify({ title: "Validation Error", description: "Please enter valid loan amount", variant: "destructive" });
      return;
    }
    if (!itemDraft.marketValue || parseFloat(itemDraft.marketValue) <= 0) {
      notify({ title: "Validation Error", description: "Please enter valid market value", variant: "destructive" });
      return;
    }

    const newItem: ItemPayload = {
      description: "Gold Item",
      content: itemDraft.content,
      condition: itemDraft.condition,
      weightGrams: parseFloat(itemDraft.weight),
      karat: itemDraft.karat,
      appraisedValue: parseFloat(itemDraft.appraisedValue),
      marketValue: parseFloat(itemDraft.marketValue),
      images: itemDraft.images,
    };

    setItems((prev) => [...prev, newItem]);
    setItemDraft(emptyItemDraft);

    notify({ title: "Item Added", description: `Added item ${items.length + 1}` });
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTransaction = () => {
    if (!customerName.trim() || !customerAddress.trim() || !gender) {
      notify({ title: "Validation Error", description: "Please fill in all required customer fields", variant: "destructive" });
      return;
    }

    const identityError = validateIdentity(idType, identityNumber);
    if (identityError) {
      notify({ title: "Validation Error", description: identityError, variant: "destructive" });
      return;
    }

    if (blockedReason) {
      notify({ title: "Blocked Customer", description: blockedReason, variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      notify({ title: "Validation Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    if (!rateOverrideEnabled && !selectedRateId) {
      notify({ title: "Validation Error", description: "Please select an interest rate", variant: "destructive" });
      return;
    }

    if (rateOverrideEnabled && (!manualInterestRate || parseFloat(manualInterestRate) <= 0)) {
      notify({ title: "Validation Error", description: "Please enter a valid interest rate", variant: "destructive" });
      return;
    }

    const rateValue = rateOverrideEnabled ? parseFloat(manualInterestRate) : 0;
    if (rateOverrideEnabled && (rateValue < 0.1 || rateValue > 50)) {
      notify({ title: "Validation Error", description: "Interest rate must be between 0.1% and 50%", variant: "destructive" });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmDialog(false);

      const today = new Date();
      const pawnDate = today.toISOString().split("T")[0];
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths, 10));
      const maturityDateStr = maturityDate.toISOString().split("T")[0];

      let effectiveRatePercent: number;
      let firstMonthRatePercent: number;
      if (rateOverrideEnabled && manualInterestRate) {
        effectiveRatePercent = parseFloat(manualInterestRate);
        firstMonthRatePercent = effectiveRatePercent / 12;
      } else {
        const selectedRate = rates.find((r) => r.id === selectedRateId);
        effectiveRatePercent = selectedRate?.rate_percent || selectedRate?.ratePercent || 0;
        firstMonthRatePercent = selectedRate?.firstMonthRatePercent || effectiveRatePercent / 12;
      }

      const firstItem = items[0];
      const allImages = items.flatMap((item) => item.images);

      const transactionData = {
        customerName,
        customerNic: identityNumber.trim(),
        idType,
        gender,
        customerAddress,
        customerPhone,
        customerType: "Regular",
        itemDescription: items.length > 1 ? `Multiple items (${items.length})` : firstItem.description,
        itemContent: firstItem.content,
        itemCondition: firstItem.condition,
        itemWeightGrams: totals.weight,
        itemKarat: firstItem.karat,
        appraisedValue: totals.appraised,
        loanAmount: totals.appraised,
        interestRateId: selectedRateId,
        interestRatePercent: effectiveRatePercent,
        firstMonthInterestRatePercent: firstMonthRatePercent,
        rateOverride: rateOverrideEnabled,
        periodMonths: parseInt(periodMonths, 10),
        patternMode: patternUnlocked ? "B" : "A",
        pawnDate,
        maturityDate: maturityDateStr,
        remarks,
        imageUrls: allImages,
        items,
      };

      const response = await apiClient.pawnTransactions.create(transactionData);

      notify({ title: "Success", description: `Pawning transaction created successfully! Pawn ID: ${response.pawnId || response.pawn_id}`, variant: "success" });

      setCustomerName("");
      setIdentityNumber("");
      setCustomerPhone("");
      setCustomerAddress("");
      setGender("");
      setIdType("NIC");
      setIdentityVerified(false);
      setCustomerFound(false);
      setBlockedReason(null);
      setPatternUnlocked(false);
      setPatternBuffer("");
      setPeriodMonths("12");
      setItemDraft(emptyItemDraft);
      setItems([]);
      setSelectedRateId("");
      setRemarks("");
      setRateOverrideEnabled(false);
      setManualInterestRate("");
      setShowPinDialog(false);
      setManagerPin("");

      navigate("/transactions");
    } catch (error) {
      notify({ title: "Error", description: "Failed to create transaction", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedRateName = rates.find((r) => r.id === selectedRateId)?.name || "Not selected";
  const selectedRateValue = rates.find((r) => r.id === selectedRateId)?.rate_percent || rates.find((r) => r.id === selectedRateId)?.ratePercent || 0;

  const isFormValid =
    customerName.trim().length > 0 &&
    identityNumber.trim().length > 0 &&
    gender.length > 0 &&
    customerAddress.trim().length > 0 &&
    !blockedReason &&
    items.length > 0 &&
    totals.appraised > 0 &&
    (rateOverrideEnabled
      ? manualInterestRate.trim().length > 0 && parseFloat(manualInterestRate) >= 0.1 && parseFloat(manualInterestRate) <= 50
      : selectedRateId.length > 0);

  const smallLabel: React.CSSProperties = { fontSize: "0.75rem" };
  const microLabel: React.CSSProperties = { fontSize: "0.625rem" };

  return (
    <PageWrapper title="Create Ticket" isProtected={false}>
      <LoadingOverlay isLoading={loading} />

      <Page container="fluid">
        <div className="d-flex align-items-center gap-3 mb-3">
          <Button color="dark" isLight icon="ArrowBack" onClick={() => navigate("/dashboard")} aria-label="Back to Dashboard" />
          <h1 className="fs-5 fw-bold mb-0">Create Ticket</h1>
        </div>

        <div className="row g-3">
          {/* Customer Details */}
          <div className="col-12 col-lg-8">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Customer Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="row g-3">
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <label className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>ID Type</label>
                    <Select ariaLabel="ID Type" size="sm" value={idType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdType(e.target.value as IdType)}>
                      <Option value="NIC">NIC</Option>
                      <Option value="Passport">Passport</Option>
                      <Option value="DrivingLicense">Driving License</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </div>

                  <div className="col-12 col-sm-6 position-relative">
                    <div className="d-flex align-items-center gap-2">
                      <label htmlFor="identityNumber" className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>ID Number</label>
                      <div className="flex-grow-1 position-relative">
                        <Input
                          id="identityNumber"
                          size="sm"
                          value={identityNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentityNumber(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); handleVerifyIdentity(); } }}
                          placeholder={`Enter ${identityLabel.toLowerCase()}`}
                        />
                        {showCustomerDropdown && customerSearchResults.length > 0 && (
                          <div className="position-absolute start-0 end-0 top-100 border rounded bg-body shadow-lg" style={{ zIndex: 50, maxHeight: 160, overflowY: "auto" }}>
                            {customerSearchResults.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => handleSelectCustomer(customer)}
                                className="w-100 text-start btn btn-link text-decoration-none px-3 py-2 border-bottom text-body"
                                style={smallLabel}
                              >
                                <p className="fw-medium mb-0" style={smallLabel}>{customer.fullName}</p>
                                <p className="text-primary mb-0" style={microLabel}>NIC: {customer.nic}</p>
                                {customer.phone && <p className="text-muted mb-0" style={microLabel}>{customer.phone}</p>}
                              </button>
                            ))}
                          </div>
                        )}
                        {identityVerified && !blockedReason && (
                          <p className="text-success mb-0 mt-1" style={microLabel}>✓ {customerFound ? "Auto-filled" : "No existing record"}</p>
                        )}
                        {blockedReason && <p className="text-danger mb-0 mt-1" style={microLabel}>{blockedReason}</p>}
                        {identityVerifying && <p className="text-info mb-0 mt-1" style={microLabel}>Searching...</p>}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <label className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Gender</label>
                    <div className="d-flex gap-3">
                      {["Male", "Female"].map((g) => (
                        <Checks key={g} type="radio" name="gender" id={`gender-${g}`} label={g} value={g} checked={gender === g} onChange={() => setGender(g)} />
                      ))}
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <label htmlFor="customerName" className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Name</label>
                    <Input id="customerName" size="sm" value={customerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)} />
                  </div>

                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <label htmlFor="customerPhone" className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Telephone</label>
                    <Input id="customerPhone" size="sm" value={customerPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)} />
                  </div>

                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <label className="fw-semibold flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Email</label>
                    <div className="flex-grow-1 border rounded px-2 bg-body-tertiary text-muted d-flex align-items-center" style={{ height: 31, fontSize: "0.625rem" }}>
                      Not Available
                    </div>
                  </div>

                  <div className="col-12 d-flex align-items-start gap-2">
                    <label htmlFor="customerAddress" className="fw-semibold flex-shrink-0 mt-1" style={{ ...smallLabel, width: 96 }}>Address</label>
                    <textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={2}
                      className="form-control form-control-sm flex-grow-1"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Duration */}
          <div className="col-12 col-lg-4">
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between w-100">
                  <CardTitle className="fs-6">Duration</CardTitle>
                  {patternUnlocked && <Badge color="danger">SPECIAL MODE</Badge>}
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="bg-primary text-white rounded p-3 mb-3">
                  <p className="fw-bold mb-2" style={smallLabel}>Duration Type</p>
                  <div className="row g-2">
                    {(patternUnlocked
                      ? [
                          { value: "12", label: "One Year (A)" },
                          { value: "12B", label: "One Year (B)" },
                          { value: "1", label: "1 Month" },
                          { value: "3", label: "3 Months" },
                        ]
                      : [{ value: "12", label: "1 Year" }]
                    ).map((opt) => (
                      <div key={opt.value} className="col-6">
                        <label className="d-flex align-items-center gap-1" style={microLabel}>
                          <input
                            type="radio"
                            name="durationRadio"
                            value={opt.value}
                            checked={opt.value === "12B" ? periodMonths === "12" && patternUnlocked : periodMonths === opt.value}
                            onChange={() => setPeriodMonths(opt.value === "12B" ? "12" : opt.value)}
                          />
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="fw-bold text-warning mb-0" style={smallLabel}>Evident Ref # :</p>
              </CardBody>
            </Card>
          </div>

          {/* Item Details */}
          <div className="col-12 col-lg-8">
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between w-100">
                  <CardTitle className="fs-6">Item Details</CardTitle>
                  <Badge color="secondary" isLight rounded="pill">{items.length} item(s)</Badge>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-muted fw-bold text-uppercase mb-2" style={microLabel}>Add Gold Item</p>

                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <div className="rounded border bg-body-tertiary p-3">
                      <p className="text-muted fw-bold text-uppercase mb-2" style={microLabel}>Item Information</p>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="d-flex align-items-center justify-content-between flex-shrink-0" style={{ width: 80 }}>
                          <label className="fw-semibold text-muted" style={smallLabel}>Type</label>
                          <Button color="primary" isLink onClick={() => setShowAddItemTypeDialog(true)} icon="AddCircle" isVisuallyHidden aria-label="Add item type" className="p-0" />
                        </div>
                        <Select ariaLabel="Item Type" size="sm" value={itemDraft.content} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateDraft({ content: e.target.value })} placeholder="Select item type...">
                          {itemTypes.length > 0 ? (
                            itemTypes.map((type) => <Option key={type.id} value={type.name}>{type.name}</Option>)
                          ) : (
                            <>
                              <Option value="Ring">Ring</Option>
                              <Option value="Chain">Chain</Option>
                              <Option value="Bracelet">Bracelet</Option>
                              <Option value="Necklace">Necklace</Option>
                              <Option value="Earrings">Earrings</Option>
                              <Option value="Other">Other</Option>
                            </>
                          )}
                        </Select>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 80 }}>Gold Content</label>
                        <Select ariaLabel="Karat" size="sm" value={itemDraft.karat} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateDraft({ karat: e.target.value })}>
                          <Option value="N/A">N/A</Option>
                          <Option value="10K">10K</Option>
                          <Option value="14K">14K</Option>
                          <Option value="18K">18K</Option>
                          <Option value="22K">22K</Option>
                          <Option value="24K">24K</Option>
                        </Select>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 80 }}>Weight (g)</label>
                        <NumberInput value={itemDraft.weight} onChange={(value) => updateDraft({ weight: value })} onKeyDown={handleItemKeyDown} precision={3} placeholder="0.000" />
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 80 }}>Condition</label>
                        <Select ariaLabel="Condition" size="sm" value={itemDraft.condition} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateDraft({ condition: e.target.value })}>
                          <Option value="Excellent">Excellent</Option>
                          <Option value="Good">Good</Option>
                          <Option value="Fair">Fair</Option>
                          <Option value="Poor">Poor</Option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <div className="rounded border bg-body-tertiary p-3">
                      <p className="text-muted fw-bold text-uppercase mb-2" style={microLabel}>Valuation</p>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Loan Amount</label>
                        <NumberInput value={itemDraft.appraisedValue} onChange={(value) => updateDraft({ appraisedValue: value })} onKeyDown={handleItemKeyDown} precision={2} placeholder="0.00" />
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Market Value</label>
                        <NumberInput value={itemDraft.marketValue} onChange={(value) => updateDraft({ marketValue: value })} onKeyDown={handleItemKeyDown} precision={2} placeholder="0.00" />
                      </div>

                      <p className="text-muted mb-0 pt-1" style={microLabel}>LKR · auto-summed into transaction totals</p>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <Button color="primary" size="sm" icon="AddCircle" className="flex-grow-1" onClick={handleAddItem}>
                    Add Item
                  </Button>
                  <Button color="dark" isLight size="sm" icon="Upload" onClick={() => document.getElementById("image-upload-sample")?.click()}>
                    Upload
                  </Button>
                  <input id="image-upload-sample" type="file" accept="image/*" multiple onChange={handleImageUpload} className="d-none" />
                  <span className="text-muted align-self-center" style={microLabel}>{itemDraft.images.length} img(s)</span>
                </div>

                {itemDraft.images.length > 0 && (
                  <div className="row g-1 mt-2">
                    {itemDraft.images.map((preview, index) => (
                      <div key={index} className="col-1 position-relative">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-100 rounded border" style={{ height: 24, objectFit: "cover" }} />
                        <button type="button" onClick={() => removeDraftImage(index)} className="btn-close btn-close-white bg-danger rounded-circle position-absolute top-0 end-0" style={{ width: 12, height: 12, padding: 2 }} />
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-muted fw-bold text-uppercase mt-3 mb-2" style={microLabel}>Added Items</p>
                {items.length > 0 ? (
                  <div className="row g-2" style={{ maxHeight: 160, overflowY: "auto" }}>
                    {items.map((item, index) => (
                      <div key={index} className="col-12 col-sm-6">
                        <div className="position-relative rounded border bg-body p-2 shadow-sm">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="btn-close position-absolute top-0 end-0 m-1" style={{ width: 8, height: 8 }} title="Remove item" />
                          <p className="fw-semibold text-truncate mb-1 pe-4" style={smallLabel}>{item.content || item.description || "Item"}</p>
                          <div className="row g-1 text-muted" style={microLabel}>
                            {item.karat !== "N/A" && <div className="col-6">Karat: {item.karat}</div>}
                            <div className="col-6">Weight: {formatWeight(item.weightGrams)} g</div>
                            <div className="col-6">Loan: LKR {formatAmount(item.appraisedValue)}</div>
                            <div className="col-6">Market: LKR {formatAmount(item.marketValue)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center rounded border border-dashed bg-body-tertiary" style={{ height: 52 }}>
                    <p className="text-muted mb-0" style={microLabel}>No items added yet</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Financial Summary */}
          <div className="col-12 col-lg-4">
            <Card className="h-100 d-flex flex-column">
              <CardHeader>
                <CardTitle className="fs-6">Summary</CardTitle>
              </CardHeader>
              <CardBody className="pt-0 d-flex flex-column justify-content-between flex-grow-1">
                <div className="bg-l10-info rounded border p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold text-muted" style={smallLabel}>Issue Date :</span>
                    <span className="text-muted" style={smallLabel}>{new Date().toLocaleDateString("en-GB")}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold text-muted" style={smallLabel}>Due Date :</span>
                    <span className="text-muted" style={smallLabel}>
                      {(() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + parseInt(periodMonths, 10));
                        return d.toLocaleDateString("en-GB");
                      })()}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold text-muted" style={smallLabel}>Redeemed Date :</span>
                    <span className="text-muted" style={smallLabel}>—</span>
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-2">
                    <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Duration</label>
                    <Input size="sm" value={`${periodMonths} month(s)`} readOnly />
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-2">
                    <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Total Wt (g)</label>
                    <Input size="sm" className="fw-semibold" value={totals.weight > 0 ? formatWeight(totals.weight) : ""} readOnly />
                  </div>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="fw-semibold text-muted" style={smallLabel}>Rate</label>
                      {!rateOverrideEnabled && (
                        <Button color="primary" isLink className="p-0" onClick={handleRequestRateOverride} style={smallLabel}>
                          Override
                        </Button>
                      )}
                    </div>

                    {rateOverrideEnabled ? (
                      <>
                        <Input size="sm" value={manualInterestRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualInterestRate(e.target.value)} placeholder="0.1-50" />
                        <p className="text-warning mb-0 mt-1" style={microLabel}>Manager override (0.1% - 50%)</p>
                      </>
                    ) : (
                      <Select ariaLabel="Interest Rate" size="sm" value={selectedRateId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRateId(e.target.value)} placeholder="Select rate">
                        {rates.map((r) => (
                          <Option key={r.id} value={r.id}>{`${r.name} - ${r.rate_percent || r.ratePercent}% per annum`}</Option>
                        ))}
                      </Select>
                    )}
                    <p className="text-primary mb-0 mt-1" style={microLabel}>Selected rate applies to all items in this transaction.</p>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-semibold text-muted flex-shrink-0" style={{ ...smallLabel, width: 96 }}>Total Loan Amount</label>
                    <Input size="sm" value={totals.appraised > 0 ? formatAmount(totals.appraised) : ""} readOnly disabled placeholder="Auto-calculated from item loan amounts" />
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-3">
                  <Button
                    color="primary"
                    onClick={handleCreateTransaction}
                    isDisable={!isFormValid || loading}
                    title={!isFormValid ? "Please fill in all required fields and add at least one item" : undefined}
                  >
                    Add
                  </Button>
                  <Button color="primary" isOutline onClick={() => navigate("/transactions")}>
                    Cancel
                  </Button>
                </div>
                {!isFormValid && (
                  <p className="text-muted text-end mt-1 mb-0" style={microLabel}>
                    {items.length === 0 ? "Add at least one item to continue" : "Fill in all required customer fields to continue"}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>

      {/* Confirm Dialog */}
      <FormModal
        isOpen={showConfirmDialog}
        setIsOpen={setShowConfirmDialog}
        title="Confirm Transaction"
        onSubmit={confirmSubmit}
        isSubmitting={loading}
        submitLabel="Confirm & Submit"
        size="lg"
      >
        <p className="text-muted small mb-0">Please review the transaction details before submitting</p>

        <div>
          <h4 className="fs-6 fw-semibold border-bottom pb-1">Customer Information</h4>
          <div className="row g-2 small">
            <div className="col-6"><span className="text-muted">Name:</span> <span className="fw-medium">{customerName}</span></div>
            <div className="col-6"><span className="text-muted">{identityLabel}:</span> <span className="fw-medium">{identityNumber}</span></div>
            <div className="col-6"><span className="text-muted">Gender:</span> <span className="fw-medium">{gender}</span></div>
            <div className="col-6"><span className="text-muted">Phone:</span> <span className="fw-medium">{customerPhone || "N/A"}</span></div>
            <div className="col-12"><span className="text-muted">Address:</span> <span className="fw-medium">{customerAddress}</span></div>
          </div>
        </div>

        <div>
          <h4 className="fs-6 fw-semibold border-bottom pb-1">Items ({items.length})</h4>
          <div className="d-flex flex-column gap-2" style={{ maxHeight: 192, overflowY: "auto" }}>
            {items.map((item, index) => (
              <div key={index} className="p-2 bg-body-tertiary rounded border small">
                <p className="fw-medium mb-0">Item {index + 1}: {item.description || "Gold Item"}</p>
                <p className="text-muted mb-0 mt-1" style={microLabel}>
                  Type: {item.content} | Condition: {item.condition} | Weight: {formatWeight(item.weightGrams)}g | Karat: {item.karat}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="fs-6 fw-semibold border-bottom pb-1">Transaction Summary</h4>
          <div className="row g-2 small bg-body-tertiary p-3 rounded">
            <div className="col-6"><span className="text-muted">Total Items:</span> <span className="fw-medium">{items.length}</span></div>
            <div className="col-6"><span className="text-muted">Total Weight:</span> <span className="fw-medium">{formatWeight(totals.weight)} g</span></div>
            <div className="col-6"><span className="text-muted">Total Appraised:</span> <span className="fw-medium">LKR {formatAmount(totals.appraised)}</span></div>
            <div className="col-6"><span className="text-muted">Total Market:</span> <span className="fw-medium">LKR {formatAmount(totals.market)}</span></div>
            <div className="col-6"><span className="text-muted">Total Loan Amount:</span> <span className="fw-semibold text-primary">LKR {formatAmount(totals.appraised)}</span></div>
            <div className="col-6"><span className="text-muted">Period:</span> <span className="fw-medium">{periodMonths} months</span></div>
            <div className="col-12"><span className="text-muted">Interest Rate:</span> <span className="fw-medium">{selectedRateName} ({selectedRateValue}% per annum)</span></div>
            <div className="col-12"><span className="text-muted">Pattern Mode:</span> <span className="fw-medium">{patternUnlocked ? "B" : "A"}</span></div>
            {remarks && <div className="col-12"><span className="text-muted">Remarks:</span> <span className="fw-medium">{remarks}</span></div>}
          </div>
        </div>
      </FormModal>

      {/* Manager PIN Dialog */}
      <FormModal
        isOpen={showPinDialog}
        setIsOpen={setShowPinDialog}
        title="Manager PIN Required"
        onSubmit={handleVerifyManagerPin}
        isSubmitting={pinVerifying}
        submitLabel="Verify PIN"
      >
        <p className="text-muted small mb-0">Enter your manager PIN to override the interest rate</p>
        <Input
          type="password"
          value={managerPin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManagerPin(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); handleVerifyManagerPin(); } }}
          placeholder="Enter your PIN"
          maxLength={6}
          autoFocus
        />
      </FormModal>

      <AddItemTypeDialog
        open={showAddItemTypeDialog}
        onOpenChange={setShowAddItemTypeDialog}
        onSuccess={(newItemType) => {
          fetchItemTypes();
          updateDraft({ content: newItemType.name });
        }}
      />
    </PageWrapper>
  );
}
