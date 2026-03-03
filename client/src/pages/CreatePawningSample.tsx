import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, Upload, X, Plus } from "lucide-react";

type IdType = "NIC" | "Passport" | "DrivingLicense";

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
  const [rates, setRates] = useState<any[]>([]);

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

  // Item draft + list
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [items, setItems] = useState<ItemPayload[]>([]);

  // Transaction fields
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("12");
  const [remarks, setRemarks] = useState("");

  // Hidden feature: T-N-D sequence toggles period field
  const [showPeriodField, setShowPeriodField] = useState(false);
  const keySequenceRef = useRef<string[]>([]);
  const keyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    // Reset verification whenever identity type/value changes
    setIdentityVerified(false);
    setCustomerFound(false);
    setBlockedReason(null);
  }, [idType, identityNumber]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!["t", "n", "d"].includes(key)) return;

      keySequenceRef.current.push(key);
      if (keyTimerRef.current) clearTimeout(keyTimerRef.current);

      if (keySequenceRef.current.length >= 3) {
        const lastThree = keySequenceRef.current.slice(-3).join("");
        if (lastThree === "tnd") {
          setShowPeriodField((prev) => !prev);
          keySequenceRef.current = [];
        }
      }

      keyTimerRef.current = setTimeout(() => {
        keySequenceRef.current = [];
      }, 3000);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (keyTimerRef.current) clearTimeout(keyTimerRef.current);
    };
  }, []);

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      setRates(data || []);
    } catch (error: any) {
      console.error("Failed to fetch rates:", error);
      toast({
        title: "Error",
        description: "Failed to load interest rates",
        variant: "destructive",
      });
    }
  };

  const totals = items.reduce(
    (acc, item) => {
      acc.weight += item.weightGrams;
      acc.appraised += item.appraisedValue;
      acc.market += item.marketValue;
      return acc;
    },
    { weight: 0, appraised: 0, market: 0 }
  );

  // Auto-calculate loan amount from total appraised value of added items.
  useEffect(() => {
    if (items.length > 0) {
      setLoanAmount(totals.appraised.toFixed(2));
    } else {
      setLoanAmount("");
    }
  }, [items, totals.appraised]);

  const updateDraft = (patch: Partial<ItemDraft>) => {
    setItemDraft((prev) => ({ ...prev, ...patch }));
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

    const licenseRegex = /^[A-Za-z0-9\-]{6,15}$/;
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
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error?.message || "Failed to verify identity",
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

    toast({
      title: "Item Added",
      description: `Added item ${items.length + 1}`,
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Customer validation
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
      toast({
        title: "Validation Error",
        description: "Please verify identity first",
        variant: "destructive",
      });
      return;
    }

    if (blockedReason) {
      toast({ title: "Blocked Customer", description: blockedReason, variant: "destructive" });
      return;
    }

    // Transaction validation
    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRateId) {
      toast({
        title: "Validation Error",
        description: "Please select an interest rate",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const today = new Date();
      const pawnDate = today.toISOString().split("T")[0];
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths, 10));
      const maturityDateStr = maturityDate.toISOString().split("T")[0];

      const selectedRate = rates.find((r) => r.id === selectedRateId);
      const effectiveRatePercent = selectedRate?.rate_percent || selectedRate?.ratePercent || 0;

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
        periodMonths: parseInt(periodMonths, 10),
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

      navigate("/transactions");
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const identityLabel = idType === "NIC" ? "NIC" : idType === "Passport" ? "Passport" : "Driving License";

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      <div className="h-[calc(100vh-4rem)] overflow-hidden p-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 pb-2">
            <CardTitle className="text-xl">Create Pawning Transaction (Single Page)</CardTitle>
            <p className="text-xs text-muted-foreground">Identity-first verification, multi-item support, pattern unlock for period</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 h-full">
              {/* Left: Customer + Current Item Editor */}
              <div className="col-span-7 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
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
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 text-xs px-2"
                          onClick={handleVerifyIdentity}
                          disabled={identityVerifying}
                        >
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

                    <div className="space-y-1">
                      <Label htmlFor="customerName" className="text-xs">Name <span className="text-red-500">*</span></Label>
                      <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                      <Label htmlFor="customerPhone" className="text-xs">Phone</Label>
                      <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="customerAddress" className="text-xs">Address <span className="text-red-500">*</span></Label>
                      <Input id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Item Editor (Add Multiple Items)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={itemDraft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                        rows={1}
                        className="text-sm resize-none min-h-0 h-8 py-1"
                      />
                    </div>
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
                      <Input type="number" step="0.01" value={itemDraft.weight} onChange={(e) => updateDraft({ weight: e.target.value })} className="h-8 text-sm" />
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
                      <Input type="number" step="0.01" value={itemDraft.appraisedValue} onChange={(e) => updateDraft({ appraisedValue: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Market (LKR) *</Label>
                      <Input type="number" step="0.01" value={itemDraft.marketValue} onChange={(e) => updateDraft({ marketValue: e.target.value })} className="h-8 text-sm" />
                    </div>
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
                      <Button type="button" size="sm" className="h-7 text-xs ml-auto" onClick={handleAddItem}>
                        <Plus className="h-3 w-3 mr-1" />Add Item
                      </Button>
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

              {/* Right: Added Items + Transaction Details */}
              <div className="col-span-5 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Added Items ({items.length})</h3>
                  <div className="space-y-1">
                    {items.slice(0, 4).map((item, index) => (
                      <div key={`${item.description}-${index}`} className="text-xs border rounded p-1 flex items-center justify-between gap-2">
                        <span className="truncate">{index + 1}. {item.description} ({item.weightGrams}g)</span>
                        <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => handleRemoveItem(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {items.length > 4 && <p className="text-[11px] text-muted-foreground">+{items.length - 4} more item(s)</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Transaction Details</h3>
                  <div className="space-y-1">
                    <Label htmlFor="loanAmount" className="text-xs">Loan Amount (LKR)</Label>
                    <Input id="loanAmount" type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="h-8 text-sm" />
                    <p className="text-[11px] text-muted-foreground">Auto-filled from total appraised value</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Interest Rate <span className="text-red-500">*</span></Label>
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
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {showPeriodField ? (
                      <div className="space-y-1">
                        <Label className="text-xs">Period (months)</Label>
                        <Select value={periodMonths} onValueChange={setPeriodMonths}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[3, 6, 9, 12, 18, 24].map((m) => (
                              <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs">Period</Label>
                        <p className="text-[11px] text-muted-foreground border rounded h-8 px-2 flex items-center">Type T-N-D to unlock period</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Remarks</Label>
                      <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-muted/50 rounded space-y-1">
                  <p className="text-xs font-semibold">Summary</p>
                  <div className="grid grid-cols-2 gap-x-2 text-xs">
                    <span className="text-muted-foreground">Identity:</span><span className="font-medium truncate">{idType}: {identityNumber || "-"}</span>
                    <span className="text-muted-foreground">Items:</span><span className="font-medium">{items.length}</span>
                    <span className="text-muted-foreground">Total Weight:</span><span className="font-medium">{totals.weight.toFixed(2)} g</span>
                    <span className="text-muted-foreground">Appraised:</span><span className="font-medium">LKR {totals.appraised.toLocaleString()}</span>
                    <span className="text-muted-foreground">Market:</span><span className="font-medium">LKR {totals.market.toLocaleString()}</span>
                    <span className="text-muted-foreground">Loan:</span><span className="font-medium text-primary">LKR {Number(loanAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => navigate("/transactions")} className="flex-1 h-8 text-xs">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-8 text-xs">
                    {loading ? "Creating..." : "Create Transaction"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

