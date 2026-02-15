import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Power } from "lucide-react";
import apiClient from "@/integrations/api";

export default function InterestRates() {
  const [rates, setRates] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [customerType, setCustomerType] = useState("Regular");
  const { toast } = useToast();

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getAll();
      setRates(data);
    } catch (error: any) {
      console.error('Failed to fetch interest rates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch interest rates",
        variant: "destructive",
      });
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const handleAdd = async () => {
    try {
      await apiClient.interestRates.create({
        name,
        ratePercent: parseFloat(ratePercent),
        periodMonths: parseInt(periodMonths),
        customerType,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Interest rate created successfully",
      });
      setShowDialog(false);
      setName("");
      setRatePercent("");
      setPeriodMonths("6");
      setCustomerType("Regular");
      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create interest rate",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.interestRates.toggleActive(id);
      toast({
        title: "Success",
        description: `Interest rate ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update interest rate status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interest Rate Management</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Rate</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate %</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Customer Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.ratePercent}%</TableCell>
                  <TableCell>{r.periodMonths} months</TableCell>
                  <TableCell><Badge variant="outline">{r.customerType}</Badge></TableCell>
                  <TableCell><Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.isActive)}><Power className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rates.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No interest rates found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Interest Rate</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><Label>Rate Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Standard 6-month" /></div>
            <div><Label>Rate (%)</Label><Input type="number" step="0.01" value={ratePercent} onChange={(e) => setRatePercent(e.target.value)} required /></div>
            <div><Label>Period (months)</Label>
              <Select value={periodMonths} onValueChange={setPeriodMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[3,6,9,12,18,24].map((m) => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Customer Type</Label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Loyal">Loyal</SelectItem>
                  <SelectItem value="Special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Create Rate</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
