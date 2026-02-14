import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Power } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<any[]>([]);
  const { toast } = useToast();
  const { role } = useAuth();

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("created_at", { ascending: false });
    if (data) setBranches(data);
  };

  const fetchManagers = async () => {
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "MANAGER");
    if (data) {
      const userIds = data.map((d) => d.user_id);
      if (userIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        if (profiles) setManagers(profiles);
      }
    }
  };

  useEffect(() => { fetchBranches(); fetchManagers(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await supabase.from("branches").update({ name, address, phone, manager_id: managerId || null }).eq("id", editing.id);
        toast({ title: "Branch updated" });
      } else {
        await supabase.from("branches").insert({ name, address, phone, manager_id: managerId || null });
        toast({ title: "Branch created" });
      }
      setShowDialog(false);
      setEditing(null);
      setName(""); setAddress(""); setPhone(""); setManagerId("");
      fetchBranches();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleActive = async (branch: any) => {
    await supabase.from("branches").update({ is_active: !branch.is_active }).eq("id", branch.id);
    fetchBranches();
  };

  const openEdit = (branch: any) => {
    setEditing(branch);
    setName(branch.name);
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setManagerId(branch.manager_id || "");
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Branch Management</h1>
        {(role === "SUPERADMIN" || role === "ADMIN") && (
          <Button onClick={() => { setEditing(null); setName(""); setAddress(""); setPhone(""); setManagerId(""); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.address}</TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(b)}><Power className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No branches found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Branch" : "Create Branch"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Branch Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div>
              <Label>Assign Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
