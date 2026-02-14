import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Power } from "lucide-react";

export default function InterestRates() {
  const [rates, setRates] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [customerType, setCustomerType] = useState("Regular");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRates = async () => {
    const { data } = await supabase.from("interest_rates").select("*").order("created_at", { ascending: false });
    if (data) setRates(data);
  };

  useEffect(() => { fetchRates(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("interest_rates").insert({
      name,
      rate_percent: parseFloat(ratePercent),
      period_months: parseInt(periodMonths),
      customer_type: customerType,
      created_by: user!.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rate created" });
    setShowDialog(false);
    setName(""); setRatePercent(""); setPeriodMonths("6"); setCustomerType("Regular");
    fetchRates();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("interest_rates").update({ is_active: !current }).eq("id", id);
    fetchRates();
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
                  <TableCell>{r.rate_percent}%</TableCell>
                  <TableCell>{r.period_months} months</TableCell>
                  <TableCell><Badge variant="outline">{r.customer_type}</Badge></TableCell>
                  <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)}><Power className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rates.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No rates configured</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Interest Rate</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
