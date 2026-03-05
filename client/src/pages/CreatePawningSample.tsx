import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NumberInput from "@/components/ui/number-input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, Upload, X } from "lucide-react";


type IdType = "NIC" | "Passport" | "DrivingLicense";

type Rate = {
  id: string;
  name: string;
  ratePercent?: number;
  rate_percent?: number;
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
  const [loanAmount, setLoanAmount] = useState("");
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

  useEffect(() => {
    fetchRatesCallback();
    fetchPatternConfig();
  }, []);

  useEffect(() => {
    // Reset verification whenever identity type/value changes
    setIdentityVerified(false);
    setCustomerFound(false);
    setBlockedReason(null);
  }, [idType, identityNumber]);

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

  useEffect(() => {
    // Auto-calculate loan amount from total appraised value of added items.
    if (items.length > 0) {
      setLoanAmount(totals.appraised.toFixed(2));
    } else {
      setLoanAmount("");
    }
  }, [items, totals.appraised]);

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
      const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;
      if (!nicRegex.test(v)) return "NIC must be 9 digits + V/X or 12 digits";
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
      toast({ title: "Validation Error", description: "Please enter valid appraised value", variant: "destructive" });
      return;
    }
    if (!itemDraft.marketValue || parseFloat(itemDraft.marketValue) <= 0) {
      toast({ title: "Validation Error", description: "Please enter valid market value", variant: "destructive" });
      return;
    }

    const newItem: ItemPayload = {
      description: itemDraft.description || "Gold Item",
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

    if (!identityVerified) {
      toast({ title: "Validation Error", description: "Please verify identity first", variant: "destructive" });
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
      if (rateOverrideEnabled && manualInterestRate) {
        effectiveRatePercent = parseFloat(manualInterestRate);
      } else {
        const selectedRate = rates.find((r) => r.id === selectedRateId);
        effectiveRatePercent = selectedRate?.rate_percent || selectedRate?.ratePercent || 0;
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
         loanAmount: parseFloat(loanAmount || "0"),
         interestRateId: selectedRateId,
         interestRatePercent: effectiveRatePercent,
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
      setLoanAmount("");
      setSelectedRateId("");
      setRemarks("");
      setRateOverrideEnabled(false);
      setManualInterestRate("");
      setShowPinDialog(false);
      setManagerPin("");

      navigate("/transactions/create-sample");
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

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      <div className="h-[calc(100vh-4rem)] overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">Create Pawning Transaction</h1>
          {patternUnlocked && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">SPECIAL MODE</span>
          )}
        </div>

        <Card className="h-[calc(100%-2.5rem)] flex flex-col">
          <CardContent className="flex-1 overflow-hidden pt-4">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-7 flex flex-col overflow-hidden pr-2">
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm border-b pb-1">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 pl-2">
                        <Label htmlFor="idType" className="text-xs">Identity Type <span className="text-red-500">*</span></Label>
                        <Select value={idType} onValueChange={(v: IdType) => setIdType(v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NIC">NIC</SelectItem>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="DrivingLicense">Driving License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 pr-2">
                        <Label htmlFor="identityNumber" className="text-xs">{identityLabel} Number <span className="text-red-500">*</span></Label>
                        <div className="flex gap-1">
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
                            placeholder={`Enter ${identityLabel.toLowerCase()} number`}
                            className="h-8 text-sm"
                          />
                          <Button type="button" variant="outline" className="h-8 text-xs px-2" onClick={handleVerifyIdentity} disabled={identityVerifying}>
                            {identityVerifying ? "..." : "Verify"}
                          </Button>
                        </div>
                        {identityVerified && !blockedReason && (
                          <p className="text-[11px] text-green-600">
                            Verified {customerFound ? "- customer auto-filled" : "- no existing record"}
                          </p>
                        )}
                        {blockedReason && <p className="text-[11px] text-red-600">{blockedReason}</p>}
                      </div>

                      <div className="space-y-1 pl-2">
                        <Label htmlFor="customerName" className="text-xs">Name <span className="text-red-500">*</span></Label>
                        <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-8 text-sm" />
                      </div>

                      <div className="space-y-1 pr-2">
                        <Label htmlFor="gender" className="text-xs">Gender <span className="text-red-500">*</span></Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 pl-2">
                        <Label htmlFor="customerPhone" className="text-xs">Phone</Label>
                        <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-8 text-sm" />
                      </div>

                      <div className="space-y-1 pr-2">
                        <Label htmlFor="customerAddress" className="text-xs">Address <span className="text-red-500">*</span></Label>
                        <Input id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2 pr-2">
                    <h3 className="font-semibold text-sm border-b pb-1">Item Editor (Press Enter to Add)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={itemDraft.content} onValueChange={(v) => updateDraft({ content: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ring">Ring</SelectItem>
                            <SelectItem value="Chain">Chain</SelectItem>
                            <SelectItem value="Bracelet">Bracelet</SelectItem>
                            <SelectItem value="Necklace">Necklace</SelectItem>
                            <SelectItem value="Earrings">Earrings</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Condition</Label>
                        <Select value={itemDraft.condition} onValueChange={(v) => updateDraft({ condition: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Fair">Fair</SelectItem>
                            <SelectItem value="Poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Weight (g) *</Label>
                        <NumberInput value={itemDraft.weight} onChange={(value) => updateDraft({ weight: value })} onKeyDown={handleItemKeyDown} />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Karat</Label>
                        <Select value={itemDraft.karat} onValueChange={(v) => updateDraft({ karat: v })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
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

                      <div className="space-y-1">
                        <Label className="text-xs">Appraised (LKR) *</Label>
                        <NumberInput value={itemDraft.appraisedValue} onChange={(value) => updateDraft({ appraisedValue: value })} onKeyDown={handleItemKeyDown} />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Market (LKR) *</Label>
                        <NumberInput value={itemDraft.marketValue} onChange={(value) => updateDraft({ marketValue: value })} onKeyDown={handleItemKeyDown} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={itemDraft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                        onKeyDown={handleItemKeyDown}
                        rows={1}
                        className="text-sm resize-none min-h-0 h-8 py-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" />Current Item Images</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("image-upload-sample")?.click()}
                          className="h-7 text-xs"
                        >
                          <Upload className="h-3 w-3 mr-1" />Upload
                          <input id="image-upload-sample" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{itemDraft.images.length} image(s)</span>
                      </div>

                      {itemDraft.images.length > 0 && (
                        <div className="grid grid-cols-6 gap-1">
                          {itemDraft.images.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-10 object-cover rounded border" />
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
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-5 flex flex-col overflow-hidden pl-2">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Added Items ({items.length})</h3>
                  <div className="border rounded-lg p-3 bg-white h-32 overflow-y-auto">
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={`${item.description}-${index}`} className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">Item {index + 1}</p>
                              <p className="text-xs text-gray-600 truncate">{item.description}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Weight: <span className="font-medium">{item.weightGrams}g</span> | Karat: <span className="font-medium">{item.karat}</span>
                              </p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveItem(index)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <p className="text-sm text-gray-400">No items added yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pl-2 pr-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Transaction Details</h3>

                  <div className="space-y-1">
                    <Label htmlFor="loanAmount" className="text-xs">Loan Amount (LKR)</Label>
                    <NumberInput id="loanAmount" value={loanAmount} onChange={(value) => setLoanAmount(value)} disabled />
                    <p className="text-[11px] text-muted-foreground">Auto-filled from total appraised value</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Interest Rate <span className="text-red-500">*</span></Label>
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
                           <NumberInput
                             value={manualInterestRate}
                             onChange={(value) => {
                               setManualInterestRate(value);
                             }}
                             placeholder="0.1 - 50"
                             className="border-amber-500"
                             title="Enter a value between 0.1 and 50"
                           />
                           <p className="text-[10px] text-amber-600">⚠️ Manager override (0.1% - 50%)</p>
                         </div>
                       ) : (
                         <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                           <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select rate" /></SelectTrigger>
                           <SelectContent>
                             {rates.map((r) => (
                               <SelectItem key={r.id} value={r.id}>
                                 {r.name} - {r.rate_percent || r.ratePercent}% per annum
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       )}
                    </div>

                    {patternUnlocked ? (
                      <div className="space-y-1">
                        <Label className="text-xs">Period (months)</Label>
                        <Select value={periodMonths} onValueChange={setPeriodMonths}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs">Period (months)</Label>
                        <Input value="12" disabled className="h-8 text-sm" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Remarks</Label>
                    <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                <div className="flex-shrink-0 space-y-2 pt-4 border-t mt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/transactions")} className="flex-1 h-9 text-sm">Cancel</Button>
                    <Button onClick={handleCreateTransaction} disabled={loading} className="flex-1 h-9 text-sm">Create Transaction</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <p className="text-xs text-muted-foreground mt-1">Type: {item.content} | Condition: {item.condition} | Weight: {item.weightGrams}g | Karat: {item.karat}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm border-b pb-1">Transaction Summary</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/50 p-3 rounded">
                <div><span className="text-muted-foreground">Total Items:</span><span className="ml-2 font-medium">{items.length}</span></div>
                <div><span className="text-muted-foreground">Total Weight:</span><span className="ml-2 font-medium">{totals.weight.toFixed(2)} g</span></div>
                <div><span className="text-muted-foreground">Total Appraised:</span><span className="ml-2 font-medium">LKR {totals.appraised.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Total Market:</span><span className="ml-2 font-medium">LKR {totals.market.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Loan Amount:</span><span className="ml-2 font-semibold text-primary">LKR {Number(loanAmount || 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Period:</span><span className="ml-2 font-medium">{periodMonths} months</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Interest Rate:</span><span className="ml-2 font-medium">{selectedRateName} ({selectedRateValue}% per annum)</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Pattern Mode:</span><span className="ml-2 font-medium">{patternUnlocked ? "B" : "A"}</span></div>
                {remarks && <div className="col-span-2"><span className="text-muted-foreground">Remarks:</span><span className="ml-2 font-medium">{remarks}</span></div>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manager PIN Required</DialogTitle>
            <DialogDescription>
              Enter your manager PIN to override the interest rate
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setShowPinDialog(false)}
              disabled={pinVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyManagerPin}
              disabled={pinVerifying || !managerPin.trim()}
            >
              {pinVerifying ? "Verifying..." : "Verify PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

