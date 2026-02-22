import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Image as ImageIcon, Upload, X, Plus } from "lucide-react";

export default function CreatePawning() {
  const { toast } = useToast();
  const { role, user, branchId } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [showPeriodField, setShowPeriodField] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Hidden feature: T-N-D key sequence for revealing period field
  const keySequenceRef = useRef<string[]>([]);
  const keyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [idType, setIdType] = useState("NIC");
  const [gender, setGender] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Item Information - Single item form state
  const [itemDescription, setItemDescription] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCondition, setItemCondition] = useState("Good");
  const [itemWeight, setItemWeight] = useState("");
  const [itemKarat, setItemKarat] = useState("24");
  const [appraisedValue, setAppraisedValue] = useState("");

  // Multiple items state
  interface ItemDetail {
    description: string;
    content: string;
    condition: string;
    weightGrams: number;
    karat: number;
    appraisedValue: number;
    images: string[]; // Base64 image strings for this item
  }
  const [items, setItems] = useState<ItemDetail[]>([]);

  // Transaction Information
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

  // Image handling for current item being added
  const [currentItemImages, setCurrentItemImages] = useState<string[]>([]);

  useEffect(() => {
    fetchRates();
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

  // Hidden feature: T-N-D key sequence to reveal period field
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Only track 't', 'n', 'd' keys
      if (['t', 'n', 'd'].includes(key)) {
        keySequenceRef.current.push(key);

        // Clear existing timer
        if (keyTimerRef.current) {
          clearTimeout(keyTimerRef.current);
        }

        // Check if sequence is T-N-D
        if (keySequenceRef.current.length >= 3) {
          const lastThree = keySequenceRef.current.slice(-3).join('');
          if (lastThree === 'tnd') {
            setShowPeriodField(!showPeriodField);
            toast({
              title: showPeriodField ? "Period Field Hidden" : "Period Field Revealed",
              description: showPeriodField
                ? "Period field is now hidden"
                : "Type T-N-D again to hide",
            });
            keySequenceRef.current = []; // Reset sequence
          }
        }

        // Reset sequence after 3 seconds of inactivity
        keyTimerRef.current = setTimeout(() => {
          keySequenceRef.current = [];
        }, 3000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (keyTimerRef.current) {
        clearTimeout(keyTimerRef.current);
      }
    };
  }, [showPeriodField, toast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentItemImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setCurrentItemImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add item to the items array
  const handleAddItem = () => {
    if (!itemDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter item description",
        variant: "destructive",
      });
      return;
    }

    const newItem: ItemDetail = {
      description: itemDescription,
      content: itemContent,
      condition: itemCondition,
      weightGrams: itemWeight ? parseFloat(itemWeight) : 0,
      karat: parseInt(itemKarat),
      appraisedValue: appraisedValue ? parseFloat(appraisedValue) : 0,
      images: currentItemImages, // Include images for this item
    };

    setItems([...items, newItem]);

    // Reset item form
    setItemDescription("");
    setItemContent("");
    setItemCondition("Good");
    setItemWeight("");
    setItemKarat("24");
    setAppraisedValue("");
    setCurrentItemImages([]); // Reset images for next item

    toast({
      title: "Item Added",
      description: "Item added to the transaction successfully",
    });
  };

  // Remove item from the items array
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item removed from the transaction",
    });
  };

  // Calculate total weight and appraised value
  const calculateTotals = () => {
    const totalWeight = items.reduce((sum, item) => sum + item.weightGrams, 0);
    const totalAppraisedValue = items.reduce((sum, item) => sum + item.appraisedValue, 0);
    return { totalWeight, totalAppraisedValue };
  };

    const selectedRate = rates.find((r) => r.id === selectedRateId);
    const effectiveRatePercent = manualRateEnabled
    ? parseFloat(manualRatePercent || "0")
    : (selectedRate?.rate_percent || selectedRate?.ratePercent || 0);

  // Auto-fill loan amount with total item value
  useEffect(() => {
    const { totalAppraisedValue } = calculateTotals();
    if (items.length > 0) {
      setLoanAmount(totalAppraisedValue.toFixed(2));
    } else {
      setLoanAmount("");
    }
  }, [items]);

  const openSummary = () => {
    setShowSummary(true);
  };

  const resolveManagerUserId = async () => {
    if (role === "MANAGER" && user?.id) {
      return user.id;
    }

    const staffBranchId = user?.branchId || branchId || null;
    if (!staffBranchId) {
      toast({
        title: "Error",
        description: "Branch ID not found for this staff user",
        variant: "destructive",
      });
      return null;
    }

    try {
      const users = await apiClient.users.getByBranch(staffBranchId);
      const manager = Array.isArray(users)
        ? users.find((u) => String(u.role).toUpperCase() === "MANAGER")
        : null;
      if (!manager?.id) {
        toast({
          title: "Error",
          description: "No branch manager found for this branch",
          variant: "destructive",
        });
        return null;
      }
      return manager.id as string;
    } catch (error: any) {
      console.error("Failed to resolve branch manager:", error);
      toast({
        title: "Error",
        description: "Failed to find branch manager",
        variant: "destructive",
      });
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
      toast({
        title: "Not Allowed",
        description: "Only branch managers or staff can enable manual rates",
        variant: "destructive",
      });
      return;
    }

    const resolvedManagerId = await resolveManagerUserId();
    if (!resolvedManagerId) return;
    setManagerUserId(resolvedManagerId);
    setPinInput("");
    setShowPinDialog(true);
  };

  const handleVerifyPin = async () => {
    if (!managerUserId) return;
    if (!pinInput.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter manager PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setPinVerifying(true);
      await apiClient.users.verifyPin(managerUserId, pinInput.trim());
      setManualRateEnabled(true);
      setShowPinDialog(false);
    } catch (error: any) {
      console.error("PIN verification failed:", error);
      toast({
        title: "Invalid PIN",
        description: "Branch manager PIN is incorrect",
        variant: "destructive",
      });
    } finally {
      setPinVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!customerName || !customerNic || !gender || !customerAddress || !loanAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Gender, ID Number, Address, Loan Amount)",
        variant: "destructive",
      });
      return;
    }

    if (!manualRateEnabled && !selectedRateId) {
      toast({
        title: "Validation Error",
        description: "Please select an interest rate",
        variant: "destructive",
      });
      return;
    }

    if (manualRateEnabled && !manualRatePercent) {
      toast({
        title: "Validation Error",
        description: "Please enter the manual interest rate",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one item
    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the transaction",
        variant: "destructive",
      });
      return;
    }

    openSummary();
    };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);

      if (!manualRateEnabled && !selectedRate) {
        toast({
          title: "Error",
          description: "Please select a valid interest rate",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate dates
      const today = new Date();
      const pawnDate = today.toISOString().split('T')[0];

      // Calculate maturity date
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths));
      const maturityDateStr = maturityDate.toISOString().split('T')[0];

      // Calculate totals from items
      const { totalWeight, totalAppraisedValue } = calculateTotals();

      // Collect all images from all items
      const allImages = items.flatMap(item => item.images);

      // Create a summary description for the transaction (for backward compatibility)
      // If multiple items, just say "Multiple items", otherwise use first item description
      const itemDescription = items.length > 1
        ? `Multiple items (${items.length} items)`
        : (items[0]?.description || "");

      // Prepare transaction data
      const transactionData = {
        customerName,
        customerNic,
        idType,
        gender,
        customerAddress,
        customerPhone,
        customerType: "Regular",
        itemDescription: itemDescription,
        itemContent: items[0]?.content || "",
        itemCondition: items[0]?.condition || "Good",
        itemWeightGrams: totalWeight,
        itemKarat: Math.round(items.reduce((sum, item) => sum + item.karat, 0) / items.length),
        appraisedValue: totalAppraisedValue,
        loanAmount: parseFloat(loanAmount),
        interestRateId: manualRateEnabled ? null : selectedRateId,
        interestRatePercent: effectiveRatePercent,
        periodMonths: parseInt(periodMonths),
        pawnDate,
        maturityDate: maturityDateStr,
        remarks: remarks,
        imageUrls: allImages,
        items: items,
      };

      const response = await apiClient.pawnTransactions.create(transactionData);

      toast({
        title: "Success",
        description: `Pawning transaction created successfully! Pawn ID: ${response.pawnId || response.pawn_id}`,
      });

      setShowSummary(false);
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

    const handleReset = () => {
    setCustomerName("");
    setCustomerNic("");
    setIdType("NIC");
    setGender("");
    setCustomerAddress("");
    setCustomerPhone("");
    setItemDescription("");
    setItemContent("");
    setItemCondition("Good");
    setItemWeight("");
    setItemKarat("24");
    setAppraisedValue("");
    setItems([]); // Clear items array
    setCurrentItemImages([]); // Clear current item images
    setLoanAmount("");
    setSelectedRateId("");
    setPeriodMonths("12");
    setRemarks("");
    setManualRateEnabled(false);
    setManualRatePercent("");
    setShowPinDialog(false);
    setPinInput("");
    setManagerUserId(null);
  };

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Pawning Transaction</h1>
          <p className="text-gray-500 mt-1">Fill in the details to create a new pawning transaction</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idType" className="text-sm font-medium">
                    ID Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger id="idType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIC">National Identity Card (NIC)</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="DrivingLicense">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerNic" className="text-sm font-medium">
                    {idType === "NIC" ? "NIC Number" : idType === "Passport" ? "Passport Number" : "License Number"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerNic"
                    value={customerNic}
                    onChange={(e) => setCustomerNic(e.target.value)}
                    placeholder={`Enter ${idType === "NIC" ? "NIC" : idType === "Passport" ? "passport" : "license"} number`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddress" className="text-sm font-medium">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Item Information</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {items.length} item(s) added
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="itemDescription" className="text-sm font-medium">
                    Item Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Describe the gold item (e.g., Gold ring with stones, Gold chain, etc.)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemContent" className="text-sm font-medium">
                    Item Content/Type
                  </Label>
                  <Select value={itemContent} onValueChange={setItemContent}>
                    <SelectTrigger id="itemContent">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ring">Ring</SelectItem>
                      <SelectItem value="Chain">Chain</SelectItem>
                      <SelectItem value="Bracelet">Bracelet</SelectItem>
                      <SelectItem value="Earrings">Earrings</SelectItem>
                      <SelectItem value="Necklace">Necklace</SelectItem>
                      <SelectItem value="Bangle">Bangle</SelectItem>
                      <SelectItem value="Pendant">Pendant</SelectItem>
                      <SelectItem value="Coin">Coin</SelectItem>
                      <SelectItem value="Bar">Bar/Ingot</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCondition" className="text-sm font-medium">
                    Item Condition
                  </Label>
                  <Select value={itemCondition} onValueChange={setItemCondition}>
                    <SelectTrigger id="itemCondition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent (Like New)</SelectItem>
                      <SelectItem value="Good">Good (Minor Wear)</SelectItem>
                      <SelectItem value="Fair">Fair (Visible Wear)</SelectItem>
                      <SelectItem value="Poor">Poor (Significant Damage)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemWeight" className="text-sm font-medium">
                    Weight (grams)
                  </Label>
                  <Input
                    id="itemWeight"
                    type="number"
                    step="0.01"
                    value={itemWeight}
                    onChange={(e) => setItemWeight(e.target.value)}
                    placeholder="Enter weight in grams"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemKarat" className="text-sm font-medium">
                    Karat
                  </Label>
                  <Select value={itemKarat} onValueChange={setItemKarat}>
                    <SelectTrigger id="itemKarat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[24, 22, 21, 18, 14].map((k) => (
                        <SelectItem key={k} value={String(k)}>
                          {k}K Gold
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appraisedValue" className="text-sm font-medium">
                    Appraised Value (LKR)
                  </Label>
                  <Input
                    id="appraisedValue"
                    type="number"
                    step="0.01"
                    value={appraisedValue}
                    onChange={(e) => setAppraisedValue(e.target.value)}
                    placeholder="Item Value (LKR)" >
                  </Input>
                </div>
              </div>

              {/* Image Upload Section - Now for current item */}
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Item Images (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload images for this specific item
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="relative"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Button>
                  <span className="text-sm text-muted-foreground py-2">
                    {currentItemImages.length} image(s) for this item
                  </span>
                </div>

                {/* Image Previews for current item */}
                {currentItemImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentItemImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Item Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item to Transaction
                </Button>
              </div>

              {/* Added Items List */}
              {items.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Added Items ({items.length})</Label>
                    <div className="text-xs text-muted-foreground">
                      Total Weight: {calculateTotals().totalWeight.toFixed(2)}g |
                      Total Value: LKR {calculateTotals().totalAppraisedValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Item {index + 1}: {item.description}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                <span>Type: {item.content || 'N/A'}</span>
                                <span>Condition: {item.condition}</span>
                                <span>Weight: {item.weightGrams}g</span>
                                <span>Karat: {item.karat}K</span>
                                <span>Value: LKR {item.appraisedValue.toLocaleString()}</span>
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {item.images.length} image(s)
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle
                className="text-xl"
                title="Type T-N-D to reveal/hide period field"
              >
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount" className="text-sm font-medium">
                    Loan Amount (LKR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    step="0.01"
                    max="9999999999999999.99"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Auto-calculated from item values"
                    required
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated from total item value</p>
                  <p className="text-xs text-muted-foreground">Maximum: 9,999,999,999,999,999.99</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="interestRate" className="text-sm font-medium">
                      Interest Rate <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleManualRateToggle}
                    >
                      {manualRateEnabled ? "Disable Manual" : "Enable Manual"}
                    </Button>
                  </div>
                  <Select
                    value={selectedRateId}
                    onValueChange={setSelectedRateId}
                    disabled={manualRateEnabled}
                  >
                    <SelectTrigger id="interestRate">
                      <SelectValue placeholder="Select interest rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {rates.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} - {r.rate_percent}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {manualRateEnabled && (
                    <Input
                      id="manualInterestRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualRatePercent}
                      onChange={(e) => setManualRatePercent(e.target.value)}
                      placeholder="Enter interest rate (%)"
                    />
                  )}
                </div>

                {/* Hidden Period Field - Type T-N-D to reveal */}
                {showPeriodField && (
                  <div className="space-y-2">
                    <Label htmlFor="periodMonths" className="text-sm font-medium">
                      Period (months)
                    </Label>
                    <Select value={periodMonths} onValueChange={setPeriodMonths}>
                      <SelectTrigger id="periodMonths">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 6, 9, 12, 18, 24].map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {m} months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional notes or remarks"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/transactions")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Pawning Transaction"}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manager PIN Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="managerPin" className="text-sm font-medium">
              Branch Manager PIN
            </Label>
            <Input
              id="managerPin"
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPinDialog(false)}
              disabled={pinVerifying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleVerifyPin}
              disabled={pinVerifying}
            >
              {pinVerifying ? "Verifying..." : "Verify PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Summary</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{customerName}</p>
                <p className="text-sm text-muted-foreground">{customerNic}</p>
                <p className="text-sm text-muted-foreground">{customerAddress}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="font-medium">LKR {Number(loanAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="text-sm">
                  {manualRateEnabled ? "Manual" : (selectedRate?.name || "-")} ({effectiveRatePercent || 0}%)
                </p>
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="text-sm">{periodMonths} months</p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Items ({items.length})</p>
                <p className="text-xs text-muted-foreground">
                  Total Weight: {calculateTotals().totalWeight.toFixed(2)}g | Total Value: LKR {calculateTotals().totalAppraisedValue.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={`${item.description}-${index}`} className="rounded-md bg-muted/40 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Item {index + 1}: {item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.content || "N/A"} | {item.condition} | {item.weightGrams}g | {item.karat}K | LKR {item.appraisedValue.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.images.length} image(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {remarks && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm whitespace-pre-wrap">{remarks}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowSummary(false)} disabled={loading}>
              Edit
            </Button>
            <Button type="button" onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? "Creating..." : "Confirm & Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

