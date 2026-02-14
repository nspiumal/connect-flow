import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ShieldOff } from "lucide-react";

export default function Blacklist() {
  const [entries, setEntries] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [reason, setReason] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [policeReportDate, setPoliceReportDate] = useState("");
  const { role, user, branchId } = useAuth();
  const { toast } = useToast();

  const fetchEntries = async () => {
    const { data } = await supabase.from("blacklist").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    const { error } = await supabase.from("blacklist").insert({
      customer_name: customerName,
      customer_nic: customerNic,
      reason,
      police_report_number: policeReportNumber || null,
      police_report_date: policeReportDate || null,
      branch_id: branchId,
      added_by: user!.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Added to blacklist" });
    setShowDialog(false);
    fetchEntries();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("blacklist").update({ is_active: !current }).eq("id", id);
    fetchEntries();
  };

  const canManage = role === "MANAGER" || role === "ADMIN" || role === "SUPERADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blacklist Management</h1>
        {canManage && (
          <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add to Blacklist</Button>
        )}
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
                {canManage && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.customer_name}</TableCell>
                  <TableCell>{e.customer_nic}</TableCell>
                  <TableCell>{e.reason}</TableCell>
                  <TableCell>{e.police_report_number || "—"} {e.police_report_date ? `(${e.police_report_date})` : ""}</TableCell>
                  <TableCell><Badge variant={e.is_active ? "destructive" : "secondary"}>{e.is_active ? "Active" : "Removed"}</Badge></TableCell>
                  {canManage && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(e.id, e.is_active)}>
                        <ShieldOff className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No blacklist entries</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Blacklist</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Customer Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div>
            <div><Label>NIC</Label><Input value={customerNic} onChange={(e) => setCustomerNic(e.target.value)} required /></div>
            <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
            <div><Label>Police Report Number</Label><Input value={policeReportNumber} onChange={(e) => setPoliceReportNumber(e.target.value)} /></div>
            <div><Label>Police Report Date</Label><Input type="date" value={policeReportDate} onChange={(e) => setPoliceReportDate(e.target.value)} /></div>
            <Button type="submit" className="w-full">Add to Blacklist</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
