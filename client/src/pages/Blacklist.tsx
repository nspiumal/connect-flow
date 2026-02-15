import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ShieldOff, ShieldCheck } from "lucide-react";
import apiClient from "@/integrations/api";

export default function Blacklist() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [reason, setReason] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [policeReportDate, setPoliceReportDate] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBlacklist = async () => {
    try {
      const data = await apiClient.blacklist.getAll();
      setBlacklist(data);
    } catch (error: any) {
      console.error('Failed to fetch blacklist:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blacklist",
        variant: "destructive",
      });
    }
  };

  useEffect(() => { fetchBlacklist(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.blacklist.create({
        customerName,
        customerNic,
        reason,
        policeReportNumber: policeReportNumber || null,
        policeReportDate: policeReportDate || null,
        branchId: user?.branchId,
        addedBy: user?.id,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Customer added to blacklist successfully",
      });
      setShowDialog(false);
      setCustomerName("");
      setCustomerNic("");
      setReason("");
      setPoliceReportNumber("");
      setPoliceReportDate("");
      fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to blacklist",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.blacklist.toggleActive(id);
      toast({
        title: "Success",
        description: `Blacklist entry ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update blacklist status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blacklist Management</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add to Blacklist</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Police Report</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blacklist.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.customerName}</TableCell>
                  <TableCell>{e.customerNic}</TableCell>
                  <TableCell className="max-w-md truncate">{e.reason}</TableCell>
                  <TableCell>
                    {e.policeReportNumber ? (
                      <div className="text-sm">
                        <div>{e.policeReportNumber}</div>
                        {e.policeReportDate && <div className="text-muted-foreground">{new Date(e.policeReportDate).toLocaleDateString()}</div>}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell><Badge variant={e.isActive ? "destructive" : "secondary"}>{e.isActive ? "Active" : "Removed"}</Badge></TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(e.id, e.isActive)}
                      title={e.isActive ? "Remove from blacklist" : "Restore to blacklist"}
                      className={e.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {e.isActive ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {blacklist.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No blacklist entries found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Blacklist</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Customer Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. John Doe" /></div>
            <div><Label>NIC</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required placeholder="e.g. 123456789V" /></div>
            <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Describe the reason for blacklisting" /></div>
            <div><Label>Police Report Number (Optional)</Label><Input value={policeReportNumber} onChange={(e) => setPoliceReportNumber(e.target.value)} placeholder="e.g. PR-2026-001" /></div>
            <div><Label>Police Report Date (Optional)</Label><Input type="date" value={policeReportDate} onChange={(e) => setPoliceReportDate(e.target.value)} /></div>
            <Button type="submit" className="w-full">Add to Blacklist</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
