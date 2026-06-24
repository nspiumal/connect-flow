import { useEffect, useMemo, useRef, useState } from "react";
import { formatAmount, formatWeight } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NumberInput from "@/components/ui/number-input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, Upload, X, PlusCircle } from "lucide-react";
import { AddItemTypeDialog } from "@/components/AddItemTypeDialog";


type IdType = "NIC" | "Passport" | "DrivingLicense";

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
  gender?: string
}

const emptyItemDraft: ItemDraft = {
  description: "",
  content: "",
  condition: "Good",
  weight: "",
  karat: "N/A",
  appraisedValue: "",
  marketValue: "",
  images: [],
};

export default function CreatePawningSample() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);

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
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
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

  const identityLabel = idType === "NIC" ? "NIC" : idType === "Passport" ? "Passport" : "Driving License";

  const fetchRatesCallback = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);

      // Auto-select default rate if available
      if (data && data.length > 0) {
        const defaultRate = data.find((rate: Rate) => rate.isDefault);
        if (defaultRate) {
          setSelectedRateId(defaultRate.id);
        } else {
          // Fall back to first rate if no default is marked
          setSelectedRateId(data[0].id);
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to load interest rates",
        variant: "destructive",
      });
    }
  };

  const fetchItemTypes = async () => {
    console.log("🔄 Fetching item types from API...");
    try {
      const data = await apiClient.itemTypes.getAll();
      console.log("✅ Fetched item types:", data);
      console.log("📊 Number of item types:", data?.length || 0);
      setItemTypes(data || []);

    } catch (error: unknown) {
      console.error("Failed to fetch item types:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Warning",
        description: `Failed to load item types${error instanceof Error ? `: ${error.message}` : ''}. Using default options.`,
        variant: "destructive",
      });
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

    // Reset verification whenever identity type/value changes by manual input
    setIdentityVerified(false);
    setCustomerFound(false);
    setBlockedReason(null);
  }, [idType, identityNumber]);

  useEffect(() => {
    // Skip one auto-search cycle when NIC is set by dropdown selection
    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      setShowCustomerDropdown(false);
      setCustomerSearchResults([]);
      return;
    }

    // If NIC is already selected + verified, do not trigger dropdown search again
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

    // Auto-search for customers when 5+ digits are entered in the NIC field
    if (idType !== "NIC" || identityNumber.length < 5) {
      setShowCustomerDropdown(false);
      setCustomerSearchResults([]);
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        setSearchDebounceTimer(null);
      }
      return;
    }

    // Clear previous timeout
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new debounced search
    const timer = setTimeout(async () => {
      try {
        setIdentityVerifying(true);

        // Check blacklist first
        const result = await apiClient.blacklist.verifyNic(identityNumber.trim());

        if (result?.isBlocked) {
          setShowCustomerDropdown(false);
          setBlockedReason(result.blocklistReason || "Customer is blocked");
          setIdentityVerifying(false);
          return;
        }

        // Search for matching customers
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
        console.log('Search error:', error);
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
      } finally {
        setIdentityVerifying(false);
      }
    }, 500); // 500ms debounce

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [identityNumber, idType, identityVerified, customerFound]);

  const handleSelectCustomer = (customer: Customer) => {
    // Mark as programmatic selection to avoid resetting verified state
    selectingCustomerRef.current = true;
    // Also skip the next auto-search effect so dropdown does not re-open
    skipNextAutoSearchRef.current = true;
    selectedNicRef.current = customer.nic || null;

    setIdentityNumber(customer.nic || "");
    setCustomerName(customer.fullName || "");
    setCustomerPhone(customer.phone || "");
    setCustomerAddress(customer.address || "");
    setGender(customer.gender || "");  // ADD GENDER
    setCustomerFound(true);
    setIdentityVerified(true);
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  useEffect(() => {
    // Global keydown listener for stealth pattern unlock
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except our special pattern logic)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      const currentTime = Date.now();
      const key = e.key.toUpperCase();

      // If more than 2 seconds since last key, reset buffer
      if (currentTime - lastKeyTime > 2000) {
        setPatternBuffer(key);
      } else {
        setPatternBuffer((prev) => prev + key);
      }
      setLastKeyTime(currentTime);

      // Check if buffer matches pattern
      const newBuffer = currentTime - lastKeyTime > 2000 ? key : patternBuffer + key;
      if (newBuffer.length >= specialPattern.length) {
        const lastChars = newBuffer.slice(-specialPattern.length);
        if (lastChars === specialPattern.toUpperCase()) {
          setPatternUnlocked(true);
          setPatternBuffer("");
          toast({ title: "Special Mode Enabled", description: "Period selection unlocked" });
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [lastKeyTime, patternBuffer, specialPattern, toast]);



  const fetchPatternConfig = async () => {
    try {
      const data = await apiClient.pawnTransactions.getPatternConfig();
      if (data?.pattern && typeof data.pattern === "string") {
        setSpecialPattern(data.pattern);
      }
    } catch {
      // keep fallback local default if config fetch fails
      setSpecialPattern("TND");
    }
  };

  const updateDraft = (patch: Partial<ItemDraft>) => {
    setItemDraft((prev) => ({ ...prev, ...patch }));
  };

  const playSuccessSound = () => {
    const audio = new Audio('/success-beep.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  const handleRequestRateOverride = () => {
    setShowPinDialog(true);
    setManagerPin("");
  };

  const handleVerifyManagerPin = async () => {
    if (!managerPin.trim()) {
      toast({ title: "Error", description: "Please enter PIN", variant: "destructive" });
      return;
    }

    try {
      setPinVerifying(true);

      // Get current user email from localStorage
      const currentUserEmail = localStorage.getItem("userEmail") || "";

      if (!currentUserEmail) {
        toast({ title: "Error", description: "User email not found", variant: "destructive" });
        return;
      }

      await apiClient.users.verifyManagerPin(
        currentUserEmail,
        managerPin,
        "Interest Rate Override - Transaction Creation"
      );

      // Success!
      playSuccessSound();
      setRateOverrideEnabled(true);
      setShowPinDialog(false);
      setManualInterestRate("");

      toast({
        title: "Override Enabled",
        description: "You can now manually enter the interest rate (0.1% - 50%)",
      });
    } catch (error: unknown) {
      toast({
        title: "Invalid PIN",
        description: error instanceof Error ? error.message : "Failed to verify PIN",
        variant: "destructive",
      });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemDraft((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDraftImage = (index: number) => {
    setItemDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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

    const licenseRegex = /^[A-Za-z0-9-]{6,15}$/;
    if (!licenseRegex.test(v)) return "Driving License must be 6-15 characters (letters, numbers, hyphen)";
    return null;
  };

  const handleVerifyIdentity = async () => {
    const identityError = validateIdentity(idType, identityNumber);
    if (identityError) {
      toast({ title: "Validation Error", description: identityError, variant: "destructive" });
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
          toast({
            title: "Blocked Customer",
            description: result.blocklistReason || "This customer is blocked",
            variant: "destructive",
          });
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
        toast({
          title: "Identity Verified",
          description: result?.customer
            ? "Customer auto-filled from database"
            : "No existing customer found. Enter details manually.",
        });
        return;
      }

      // Passport / DrivingLicense: attempt lookup using same endpoint value
      try {
        const customer = await apiClient.customers.getByNic(identity);
        setCustomerName(customer.fullName || "");
        setCustomerPhone(customer.phone || "");
        setCustomerAddress(customer.address || "");
        setCustomerFound(true);
        toast({ title: "Identity Verified", description: "Customer auto-filled from database" });
      } catch {
        setCustomerFound(false);
        toast({ title: "Identity Verified", description: "No existing customer found. Enter details manually." });
      }

      setIdentityVerified(true);
    } catch (error: unknown) {
      toast({
        title: "Verification Error",
        description: "Failed to verify identity",
        variant: "destructive",
      });
    } finally {
      setIdentityVerifying(false);
    }
  };

  const handleAddItem = () => {
    if (!itemDraft.weight || parseFloat(itemDraft.weight) <= 0) {
      toast({ title: "Validation Error", description: "Please enter valid item weight", variant: "destructive" });
      return;
    }
    if (!itemDraft.appraisedValue || parseFloat(itemDraft.appraisedValue) <= 0) {
      toast({ title: "Validation Error", description: "Please enter valid loan amount", variant: "destructive" });
      return;
    }
    if (!itemDraft.marketValue || parseFloat(itemDraft.marketValue) <= 0) {
      toast({ title: "Validation Error", description: "Please enter valid market value", variant: "destructive" });
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

    toast({ title: "Item Added", description: `Added item ${items.length + 1}` });
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
      toast({
        title: "Validation Error",
        description: "Please fill in all required customer fields",
        variant: "destructive",
      });
      return;
    }

    const identityError = validateIdentity(idType, identityNumber);
    if (identityError) {
      toast({ title: "Validation Error", description: identityError, variant: "destructive" });
      return;
    }

    if (blockedReason) {
      toast({ title: "Blocked Customer", description: blockedReason, variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    if (!rateOverrideEnabled && !selectedRateId) {
      toast({ title: "Validation Error", description: "Please select an interest rate", variant: "destructive" });
      return;
    }

    if (rateOverrideEnabled && (!manualInterestRate || parseFloat(manualInterestRate) <= 0)) {
      toast({ title: "Validation Error", description: "Please enter a valid interest rate", variant: "destructive" });
      return;
    }

    const rateValue = rateOverrideEnabled ? parseFloat(manualInterestRate) : 0;
    if (rateOverrideEnabled && (rateValue < 0.1 || rateValue > 50)) {
      toast({
        title: "Validation Error",
        description: "Interest rate must be between 0.1% and 50%",
        variant: "destructive"
      });
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

      let effectiveRatePercent;
      let firstMonthRatePercent;
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

      toast({
        title: "Success",
        description: `Pawning transaction created successfully! Pawn ID: ${response.pawnId || response.pawn_id}`,
      });

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

      navigate("/transactions/create");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRateName = rates.find((r) => r.id === selectedRateId)?.name || "Not selected";
  const selectedRateValue = rates.find((r) => r.id === selectedRateId)?.rate_percent || rates.find((r) => r.id === selectedRateId)?.ratePercent || 0;

  // Form validation: all required fields must be filled before allowing submission
  const isFormValid = (
    customerName.trim().length > 0 &&
    identityNumber.trim().length > 0 &&
    gender.length > 0 &&
    customerAddress.trim().length > 0 &&
    !blockedReason &&
    items.length > 0 &&
    totals.appraised > 0 &&
    (rateOverrideEnabled
      ? manualInterestRate.trim().length > 0 && parseFloat(manualInterestRate) >= 0.1 && parseFloat(manualInterestRate) <= 50
      : selectedRateId.length > 0)
  );

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}

      {/* ── Pawn Ticket Container ── */}
      <div className="overflow-auto p-4 min-h-[calc(100vh-4rem)]">
        <div className="pawn-ticket-form border-2 bg-white rounded shadow-md max-w-[1300px] mx-auto">

          {/* ── Ticket Header ── */}
          <div className="flex items-center justify-between bg-gray-100 border-b-2 px-4 py-2">
            <div className="w-8" />
            <h1 className="text-base font-bold tracking-wide">Pawn Ticket</h1>
            <h1
              className="h-7 w-7 text-gray-600 hover:text-red-600"
            >
            </h1>
          </div>

          {/* ── Top Row: Customer Details | Duration ── */}
          <div className="grid grid-cols-3 border-b-2">

            {/* Left/Middle: Customer Details Card (spans Col 1 & 2) */}
            <div className="col-span-2 border-r-2 p-3">
              <Card className="shadow-sm border border-gray-200 bg-white h-full overflow-hidden">
                <CardHeader className="py-2 px-3 bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-xs font-bold text-gray-700">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">

                    {/* ID Type */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20 shrink-0 font-semibold">ID Type</Label>
                      <Select value={idType} onValueChange={(v: IdType) => setIdType(v)}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NIC">NIC</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="DrivingLicense">Driving License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ID Number */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="identityNumber" className="text-xs w-20 shrink-0 font-semibold">
                        ID Number
                      </Label>
                      <div className="flex-1 relative">
                        <Input
                          id="identityNumber"
                          value={identityNumber}
                          onChange={(e) => setIdentityNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleVerifyIdentity();
                            }
                          }}
                          placeholder={`Enter ${identityLabel.toLowerCase()}`}
                          className="h-7 text-xs"
                        />
                        {showCustomerDropdown && customerSearchResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full border rounded-md bg-white shadow-lg z-50 max-h-40 overflow-y-auto">
                            {customerSearchResults.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => handleSelectCustomer(customer)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0"
                              >
                                <p className="font-medium text-xs">{customer.fullName}</p>
                                <p className="text-xs text-blue-600">NIC: {customer.nic}</p>
                                {customer.phone && <p className="text-xs text-gray-600">{customer.phone}</p>}
                              </button>
                            ))}
                          </div>
                        )}
                        {identityVerified && !blockedReason && (
                          <p className="text-[10px] text-green-600 mt-0.5">
                            ✓ {customerFound ? "Auto-filled" : "No existing record"}
                          </p>
                        )}
                        {blockedReason && <p className="text-[10px] text-red-600 mt-0.5">{blockedReason}</p>}
                        {identityVerifying && <p className="text-[10px] text-blue-600 mt-0.5">Searching...</p>}
                      </div>
                    </div>

                    {/* Gender – radio buttons */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20 shrink-0 font-semibold">Gender</Label>
                      <div className="flex items-center gap-4">
                        {["Male", "Female"].map((g) => (
                          <label key={g} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value={g}
                              checked={gender === g}
                              onChange={() => setGender(g)}
                              className="w-3 h-3"
                            />
                            <span className="text-xs">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="customerName" className="text-xs w-20 shrink-0 font-semibold">Name</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>

                    {/* Telephone */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="customerPhone" className="text-xs w-20 shrink-0 font-semibold">Telephone</Label>
                      <Input
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20 shrink-0 font-semibold">Email</Label>
                      <div className="flex-1 h-7 border border-gray-200 rounded px-2 bg-gray-50 text-[10px] text-gray-400 flex items-center">
                        Not Available
                      </div>
                    </div>

                    {/* Address – spans 2 columns */}
                    <div className="col-span-2 flex items-start gap-2">
                      <Label htmlFor="customerAddress" className="text-xs w-20 shrink-0 font-semibold mt-1">Address</Label>
                      <textarea
                        id="customerAddress"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        rows={2}
                        className="flex-1 text-xs px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Duration Type + Evident Ref */}
            <div className="p-3">
              <div className="bg-blue-700 text-white rounded p-3 mb-3">
                <p className="text-[11px] font-bold mb-2">Duration Type</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { value: "12", label: "One Year (A)" },
                    { value: "12B", label: "One Year (B)" },
                    { value: "1", label: "1 Month" },
                    { value: "3", label: "3 Months" },
                  ].map((opt) => {
                    const isLocked = !patternUnlocked && (opt.value === "1" || opt.value === "3" || opt.value === "12B");
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-1 ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <input
                          type="radio"
                          name="durationRadio"
                          value={opt.value}
                          checked={
                            opt.value === "12B"
                              ? periodMonths === "12" && patternUnlocked
                              : periodMonths === opt.value
                          }
                          onChange={() => {
                            if (!isLocked) setPeriodMonths(opt.value === "12B" ? "12" : opt.value);
                          }}
                          disabled={isLocked}
                          className="w-3 h-3 accent-white"
                        />
                        <span className="text-[11px]">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm font-bold text-yellow-600">Evident Ref # :</p>
                {patternUnlocked && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded">SPECIAL MODE</span>
                )}
              </div>
            </div>

          </div>{/* end top row */}

          {/* ── Bottom Row: Item Details (with fields) | Financial Panel ── */}
          <div className="grid grid-cols-3">

            {/* Left: Item Details Card — includes all valuation fields in compact 2-col sub-grid */}
            <div className="col-span-2 border-r-2 p-3">
              <Card className="shadow-sm border border-gray-200 bg-white overflow-hidden">
                <CardHeader className="py-2 px-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-gray-700">Item Details</CardTitle>
                  <span className="text-[10px] text-gray-650 bg-gray-200 px-2 py-0.5 rounded-full font-medium">
                    {items.length} item(s)
                  </span>
                </CardHeader>
                <CardContent className="p-3">

                  {/* ── Transaction Details & Summary ── */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3" />

                  {/* ── Add Gold Item Section ── */}
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-200 pt-2 mb-2">
                    Add Gold Item
                  </p>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
                    {/* Item Type */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center justify-between w-20 shrink-0">
                        <Label className="text-xs font-semibold text-gray-600">Item Type</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1 text-[9px] text-primary gap-1"
                          onClick={() => setShowAddItemTypeDialog(true)}
                        >
                          <PlusCircle className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <Select value={itemDraft.content} onValueChange={(v) => updateDraft({ content: v })}>
                        <SelectTrigger className="h-6 text-xs flex-1 bg-green-500 border-green-600 text-white">
                          <SelectValue placeholder="Select item type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {itemTypes.length > 0 ? (
                            itemTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Ring">Ring</SelectItem>
                              <SelectItem value="Chain">Chain</SelectItem>
                              <SelectItem value="Bracelet">Bracelet</SelectItem>
                              <SelectItem value="Necklace">Necklace</SelectItem>
                              <SelectItem value="Earrings">Earrings</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gold Content */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs w-20 shrink-0 font-semibold text-gray-600">Gold Content</Label>
                      <Select value={itemDraft.karat} onValueChange={(v) => updateDraft({ karat: v })}>
                        <SelectTrigger className="h-6 text-xs flex-1">
                          <SelectValue placeholder="Select karat..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N/A">N/A</SelectItem>
                          <SelectItem value="10K">10K</SelectItem>
                          <SelectItem value="14K">14K</SelectItem>
                          <SelectItem value="18K">18K</SelectItem>
                          <SelectItem value="22K">22K</SelectItem>
                          <SelectItem value="24K">24K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weight (g) */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs w-20 shrink-0 font-semibold text-gray-600">Weight (g)</Label>
                      <NumberInput
                        value={itemDraft.weight}
                        onChange={(value) => updateDraft({ weight: value })}
                        onKeyDown={handleItemKeyDown}
                        precision={3}
                        className="h-6 text-xs flex-1"
                        placeholder="0.000"
                      />
                    </div>

                    {/* Condition */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs w-20 shrink-0 font-semibold text-gray-600">Condition</Label>
                      <Select value={itemDraft.condition} onValueChange={(v) => updateDraft({ condition: v })}>
                        <SelectTrigger className="h-6 text-xs flex-1">
                          <SelectValue placeholder="Select condition..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Loan Amount */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs w-20 shrink-0 font-semibold text-gray-600">Loan Amount</Label>
                      <NumberInput
                        value={itemDraft.appraisedValue}
                        onChange={(value) => updateDraft({ appraisedValue: value })}
                        onKeyDown={handleItemKeyDown}
                        precision={2}
                        className="h-6 text-xs flex-1"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Market Value (LKR) */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs w-20 shrink-0 font-semibold text-gray-600">Market Value (LKR)</Label>
                      <NumberInput
                        value={itemDraft.marketValue}
                        onChange={(value) => updateDraft({ marketValue: value })}
                        onKeyDown={handleItemKeyDown}
                        precision={2}
                        className="h-6 text-xs flex-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Add Item Button + Image Upload */}
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddItem}
                      className="h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1 gap-1"
                    >
                      <PlusCircle className="h-3 w-3" /> Add Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("image-upload-sample")?.click()}
                      className="h-6 text-[10px]"
                    >
                      <Upload className="h-3 w-3 mr-1" />Upload
                      <input id="image-upload-sample" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground self-center">{itemDraft.images.length} img(s)</span>
                  </div>

                  {itemDraft.images.length > 0 && (
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {itemDraft.images.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-6 object-cover rounded border" />
                          <button
                            type="button"
                            onClick={() => removeDraftImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Added Items list (Item View) */}
                  <div className="bg-gray-50 min-h-[52px] max-h-[100px] overflow-y-auto mb-2 border border-gray-250 rounded">
                    {items.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-white transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-gray-700 truncate">
                                {item.content || item.description || "Item"}
                              </p>
                              <p className="text-[9px] text-gray-500">
                                {item.karat !== "N/A" ? item.karat : ""}{item.karat !== "N/A" ? " · " : ""}
                                {formatWeight(item.weightGrams)} g · Loan: LKR {formatAmount(item.appraisedValue)} · Market: LKR {formatAmount(item.marketValue)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[52px]">
                        <p className="text-[10px] text-gray-400">No items added yet</p>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right: Financial Summary + Actions */}
            <div className="p-3 flex flex-col justify-between">
              <div className="bg-blue-100 border border-blue-300 rounded p-3 space-y-2">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Issue Date :</span>
                  <span className="text-xs text-gray-500">{new Date().toLocaleDateString("en-GB")}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Due Date :</span>
                  <span className="text-xs text-gray-500">
                    {(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + parseInt(periodMonths, 10));
                      return d.toLocaleDateString("en-GB");
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Redeemed Date :</span>
                  <span className="text-xs text-gray-400">—</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-gray-600 w-24 shrink-0">Duration</Label>
                  <Input
                    value={`${periodMonths} month(s)`}
                    readOnly
                    className="h-7 text-xs flex-1 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-gray-600 w-24 shrink-0">Total Wt (g)</Label>
                  <Input
                    value={totals.weight > 0 ? formatWeight(totals.weight) : ""}
                    readOnly
                    className="h-7 text-xs flex-1 bg-blue-100 border-blue-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-gray-600">Rate</Label>
                    {!rateOverrideEnabled && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-blue-600"
                        onClick={handleRequestRateOverride}
                      >
                        Override
                      </Button>
                    )}
                  </div>

                  {rateOverrideEnabled ? (
                    <div className="space-y-1">
                      <Input
                        value={manualInterestRate}
                        onChange={(e) => setManualInterestRate(e.target.value)}
                        placeholder="0.1-50"
                        className="h-7 text-xs border-amber-500"
                      />
                      <p className="text-[10px] text-amber-600">Manager override (0.1% - 50%)</p>
                    </div>
                  ) : (
                    <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {rates.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} - {r.rate_percent || r.ratePercent}% per annum
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-[10px] text-blue-700">Selected rate applies to all items in this transaction.</p>
                </div>


                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-gray-600 w-24 shrink-0">Total Loan Amount</Label>
                  <Input
                    type="text"
                    value={totals.appraised > 0 ? formatAmount(totals.appraised) : ""}
                    readOnly
                    disabled
                    className="h-7 text-xs flex-1 bg-white"
                    placeholder="Auto-calculated from item loan amounts"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  onClick={handleCreateTransaction}
                  disabled={!isFormValid || loading}
                  title={!isFormValid ? "Please fill in all required fields and add at least one item" : undefined}
                  className="h-8 px-8 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/transactions")}
                  className="h-8 px-6 text-sm border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Cancel
                </Button>
              </div>
              {!isFormValid && (
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {items.length === 0
                    ? "Add at least one item to continue"
                    : "Fill in all required customer fields to continue"}
                </p>
              )}
            </div>

          </div>{/* end bottom row */}

        </div>{/* end ticket container */}
      </div>

      {/* ── Confirm Dialog ── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>Please review the transaction details before submitting</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm border-b pb-1">Customer Information</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span><span className="ml-2 font-medium">{customerName}</span></div>
                <div><span className="text-muted-foreground">{identityLabel}:</span><span className="ml-2 font-medium">{identityNumber}</span></div>
                <div><span className="text-muted-foreground">Gender:</span><span className="ml-2 font-medium">{gender}</span></div>
                <div><span className="text-muted-foreground">Phone:</span><span className="ml-2 font-medium">{customerPhone || "N/A"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span><span className="ml-2 font-medium">{customerAddress}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm border-b pb-1">Items ({items.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                    <p className="font-medium">Item {index + 1}: {item.description || "Gold Item"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {item.content} | Condition: {item.condition} | Weight: {formatWeight(item.weightGrams)}g | Karat: {item.karat}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm border-b pb-1">Transaction Summary</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/50 p-3 rounded">
                <div><span className="text-muted-foreground">Total Items:</span><span className="ml-2 font-medium">{items.length}</span></div>
                <div><span className="text-muted-foreground">Total Weight:</span><span className="ml-2 font-medium">{formatWeight(totals.weight)} g</span></div>
                <div><span className="text-muted-foreground">Total Appraised:</span><span className="ml-2 font-medium">LKR {formatAmount(totals.appraised)}</span></div>
                <div><span className="text-muted-foreground">Total Market:</span><span className="ml-2 font-medium">LKR {formatAmount(totals.market)}</span></div>
                <div><span className="text-muted-foreground">Total Loan Amount:</span><span className="ml-2 font-semibold text-primary">LKR {formatAmount(totals.appraised)}</span></div>
                <div><span className="text-muted-foreground">Period:</span><span className="ml-2 font-medium">{periodMonths} months</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Interest Rate:</span><span className="ml-2 font-medium">{selectedRateName} ({selectedRateValue}% per annum)</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Pattern Mode:</span><span className="ml-2 font-medium">{patternUnlocked ? "B" : "A"}</span></div>
                {remarks && <div className="col-span-2"><span className="text-muted-foreground">Remarks:</span><span className="ml-2 font-medium">{remarks}</span></div>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={confirmSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manager PIN Dialog ── */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manager PIN Required</DialogTitle>
            <DialogDescription>Enter your manager PIN to override the interest rate</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="managerPin">PIN</Label>
              <Input
                id="managerPin"
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVerifyManagerPin();
                  }
                }}
                placeholder="Enter your PIN"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)} disabled={pinVerifying}>
              Cancel
            </Button>
            <Button onClick={handleVerifyManagerPin} disabled={pinVerifying || !managerPin.trim()}>
              {pinVerifying ? "Verifying..." : "Verify PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddItemTypeDialog
        open={showAddItemTypeDialog}
        onOpenChange={setShowAddItemTypeDialog}
        onSuccess={(newItemType) => {
          fetchItemTypes();
          updateDraft({ content: newItemType.name });
        }}
      />
    </>
  );
}

