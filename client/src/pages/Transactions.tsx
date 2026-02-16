import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/integrations/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Edit, X, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rates, setRates] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { toast } = useToast();
  const { role } = useAuth();

  // Mock branchId - in real app this would come from user context
  const branchId = "mock-branch-id";

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemKarat, setItemKarat] = useState("24");
  const [appraisedValue, setAppraisedValue] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageBlobUrls, setImageBlobUrls] = useState<{[key: string]: string}>({});

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.pawnTransactions.getPaginated(currentPage, pageSize, 'pawnDate', 'desc');
      console.log("Fetched transactions:", response);
      setTransactions(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    }
  };

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getActive();
      console.log("Fetched rates:", data);
      setRates(data || []);
    } catch (error: any) {
      console.error("Failed to fetch rates:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, pageSize]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!customerName || !customerNic || !itemDescription || !loanAmount || !selectedRateId || !periodMonths) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get the interest rate percent from selected rate
      const selectedRate = rates.find(r => r.id === selectedRateId);
      if (!selectedRate) {
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
      const pawnDate = today.toISOString().split('T')[0]; // Today's date

      // Calculate maturity date (today + period months)
      const maturityDate = new Date(today);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(periodMonths));
      const maturityDateStr = maturityDate.toISOString().split('T')[0];

      // Prepare transaction data
      const transactionData = {
        customerName,
        customerNic,
        customerAddress,
        customerPhone,
        customerType: "Regular", // Default customer type
        itemDescription,
        itemWeightGrams: itemWeight ? parseFloat(itemWeight) : 0,
        itemKarat: parseInt(itemKarat),
        appraisedValue: appraisedValue ? parseFloat(appraisedValue) : 0,
        loanAmount: parseFloat(loanAmount),
        interestRateId: selectedRateId,
        interestRatePercent: selectedRate.rate_percent || selectedRate.ratePercent, // Get percent from selected rate
        periodMonths: parseInt(periodMonths),
        pawnDate, // Today's date
        maturityDate: maturityDateStr, // Calculated maturity date
        remarks,
        imageUrls: imagePreviews, // Base64 encoded images
      };

      // Call API to create transaction
      const response = await apiClient.pawnTransactions.create(transactionData);

      toast({
        title: "Success",
        description: `Transaction created successfully! Pawn ID: ${response.pawnId || response.pawn_id}`,
      });

      // Reset form
      setCustomerName("");
      setCustomerNic("");
      setCustomerAddress("");
      setCustomerPhone("");
      setItemDescription("");
      setItemWeight("");
      setItemKarat("24");
      setAppraisedValue("");
      setLoanAmount("");
      setSelectedRateId("");
      setPeriodMonths("6");
      setRemarks("");
      setUploadedImages([]);
      setImagePreviews([]);

      // Close dialog and refresh transactions
      setShowCreate(false);
      fetchTransactions();
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

  const openEditDialog = (transaction: any) => {
    setSelectedTransaction(transaction);
    setEditStatus(transaction.status);
    setEditRemarks(transaction.remarks || "");
    setShowEditDialog(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setLoading(true);

      // Update status if changed
      if (editStatus !== selectedTransaction.status) {
        await apiClient.pawnTransactions.updateStatus(selectedTransaction.id, editStatus);
      }

      // Update remarks if changed
      if (editRemarks !== (selectedTransaction.remarks || "")) {
        await apiClient.pawnTransactions.updateRemarks(selectedTransaction.id, editRemarks);
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });

      setShowEditDialog(false);
      setSelectedTransaction(null);
      setEditStatus("");
      setEditRemarks("");
      fetchTransactions(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);

      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Store files for later upload
      setUploadedImages((prev) => [...prev, ...files]);

      toast({
        title: "Images selected",
        description: `${files.length} image(s) selected. They will be uploaded when you create the transaction.`,
      });
    } catch (error: any) {
      console.error("Error processing images:", error);
      toast({
        title: "Error",
        description: "Failed to process images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // Function to load image with Bearer token
  const loadImageWithAuth = async (imageUrl: string, transactionId: string, imageIndex: number) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("token");

      let fullImageUrl = imageUrl;
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
        if (imageUrl.includes("pawn-transactions")) {
          const filename = imageUrl.split("pawn-transactions/")[1];
          fullImageUrl = `${apiBaseUrl}/images/pawn-transactions/${filename}`;
        } else {
          fullImageUrl = `${apiBaseUrl}${imageUrl}`;
        }
      }

      // Fetch image with Bearer token
      const response = await fetch(fullImageUrl, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (!response.ok) {
        console.error(`Failed to load image: ${fullImageUrl} (Status: ${response.status})`);
        return null;
      }

      // Convert response to blob URL
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Cache the blob URL
      const cacheKey = `${transactionId}-${imageIndex}`;
      setImageBlobUrls(prev => ({
        ...prev,
        [cacheKey]: blobUrl
      }));

      return blobUrl;
    } catch (error) {
      console.error(`Error loading image: ${imageUrl}`, error);
      return null;
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const statusBadge = (s: string) => {
    if (s === "Active") return "default";
    if (s === "Completed") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay isLoading={loading} message="Loading transactions..." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pawn Transactions</h1>
        {(role !== "STAFF" || role === "STAFF") && branchId && (
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> New Transaction</Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, NIC, or Pawn ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Defaulted">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pawn ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Rate %</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead>Status</TableHead>
                  {(role === "MANAGER" || role === "SUPERADMIN" || role === "ADMIN") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">{t.pawnId || t.pawn_id}</TableCell>
                    <TableCell>{t.customerName || t.customer_name}</TableCell>
                    <TableCell>{t.customerNic || t.customer_nic}</TableCell>
                    <TableCell>Rs. {Number(t.loanAmount || t.loan_amount).toLocaleString()}</TableCell>
                    <TableCell>{t.interestRatePercent || t.interest_rate_percent}%</TableCell>
                    <TableCell>{t.maturityDate || t.maturity_date}</TableCell>
                    <TableCell><Badge variant={statusBadge(t.status) as any}>{t.status}</Badge></TableCell>
                    {(role === "MANAGER" || role === "SUPERADMIN" || role === "ADMIN") && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(t)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Rows per page:</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {transactions.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} transactions
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {totalElements > 0 ? currentPage + 1 : 0} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Pawn Transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Customer Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div>
              <div><Label>NIC</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required /></div>
              <div><Label>Address</Label><Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Item Description</Label><Input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required /></div>
              <div><Label>Weight (grams)</Label><Input type="number" step="0.01" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} required /></div>
              <div><Label>Karat</Label>
                <Select value={itemKarat} onValueChange={setItemKarat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[24,22,21,18,14].map((k) => <SelectItem key={k} value={String(k)}>{k}K</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Appraised Value</Label><Input type="number" step="0.01" value={appraisedValue} onChange={(e) => setAppraisedValue(e.target.value)} required /></div>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Loan Amount</Label><Input type="number" step="0.01" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} required /></div>
              <div><Label>Interest Rate</Label>
                <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                  <SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger>
                  <SelectContent>
                    {rates.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} - {r.rate_percent}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Period (months)</Label>
                <Select value={periodMonths} onValueChange={setPeriodMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[3,6,9,12,18,24].map((m) => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>

            {/* Image Upload Section */}
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Item Images (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-3">Upload images of the gold item from different angles</p>

              <div className="flex gap-2 mb-3">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground py-2">{uploadedImages.length} image(s) selected</span>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create Transaction"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog - Combined Status & Remarks */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Transaction {selectedTransaction?.pawnId || selectedTransaction?.pawn_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{selectedTransaction?.customerName || selectedTransaction?.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">NIC:</span>
                  <p className="font-medium">{selectedTransaction?.customerNic || selectedTransaction?.customer_nic}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Item:</span>
                  <p className="font-medium">{selectedTransaction?.itemDescription || selectedTransaction?.item_description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <p className="font-medium">Rs. {Number(selectedTransaction?.loanAmount || selectedTransaction?.loan_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Maturity Date:</span>
                  <p className="font-medium">{selectedTransaction?.maturityDate || selectedTransaction?.maturity_date}</p>
                </div>
              </div>
            </div>

            {/* Images Gallery */}
            {selectedTransaction?.imageUrls && selectedTransaction.imageUrls.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Item Images ({selectedTransaction.imageUrls.length})
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTransaction.imageUrls.map((imageUrl: string, index: number) => (
                    <ImageWithAuth
                      key={index}
                      imageUrl={imageUrl}
                      transactionId={selectedTransaction.id}
                      imageIndex={index}
                      loadImageWithAuth={loadImageWithAuth}
                      imageBlobUrls={imageBlobUrls}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Images Message */}
            {(!selectedTransaction?.imageUrls || selectedTransaction.imageUrls.length === 0) && (
              <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No images available for this transaction
              </div>
            )}

            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status">Transaction Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">
                    <div className="flex items-center">
                      <Badge variant="default" className="mr-2">Active</Badge>
                      <span className="text-sm text-muted-foreground">- Loan is active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Completed">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">Completed</Badge>
                      <span className="text-sm text-muted-foreground">- Loan repaid</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Defaulted">
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">Defaulted</Badge>
                      <span className="text-sm text-muted-foreground">- Payment overdue</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Notes</Label>
              <Textarea
                id="remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Add notes, payment details, or any other information..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Add notes about payments, customer communication, or transaction details
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedTransaction(null);
                  setEditStatus("");
                  setEditRemarks("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTransaction}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Transaction"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component to load and display image with Bearer token authentication
function ImageWithAuth({
  imageUrl,
  transactionId,
  imageIndex,
  loadImageWithAuth,
  imageBlobUrls,
}: {
  imageUrl: string;
  transactionId: string;
  imageIndex: number;
  loadImageWithAuth: (imageUrl: string, transactionId: string, imageIndex: number) => Promise<string | null>;
  imageBlobUrls: {[key: string]: string};
}) {
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const cacheKey = `${transactionId}-${imageIndex}`;

  useEffect(() => {
    // Check if already cached
    if (imageBlobUrls[cacheKey]) {
      setDisplayUrl(imageBlobUrls[cacheKey]);
      setLoading(false);
      return;
    }

    // Load image with Bearer token
    const loadImage = async () => {
      const blobUrl = await loadImageWithAuth(imageUrl, transactionId, imageIndex);
      if (blobUrl) {
        setDisplayUrl(blobUrl);
      }
      setLoading(false);
    };

    loadImage();
  }, [cacheKey, imageBlobUrls, imageUrl, transactionId, imageIndex, loadImageWithAuth]);

  if (loading) {
    return (
      <div className="w-full h-24 object-cover rounded border bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!displayUrl) {
    return (
      <div className="w-full h-24 object-cover rounded border bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Failed to load</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={displayUrl}
        alt={`Item ${imageIndex + 1}`}
        className="w-full h-24 object-cover rounded border hover:border-blue-500 cursor-pointer transition-all"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all flex items-center justify-center">
        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">#{imageIndex + 1}</span>
      </div>
    </div>
  );
}

