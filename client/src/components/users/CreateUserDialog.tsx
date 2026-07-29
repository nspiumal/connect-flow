import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";

type AppRole = string;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("STAFF");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ name: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRoleOptions = async () => {
    try {
      const data = await apiClient.roles.getAll();
      const active = data.filter((r: any) => r.isActive);
      setRoleOptions(active.map((r: any) => ({ name: r.name, label: r.label })));
      if (active.length > 0 && !active.some((r: any) => r.name === role)) {
        setRole(active[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      console.log("Fetching branches from API...");
      const data = await apiClient.branches.getActive();
      console.log("Raw branches data received:", data);
      const normalized = data.map((b: any) => ({
        id: b.id,
        name: b.name,
      }));
      console.log("Normalized branches:", normalized);
      setBranches(normalized);
      console.log("Branches state updated, count:", normalized.length);
    } catch (error: any) {
      console.error("Failed to fetch branches:", error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    }
  };

  // Fetch branches and role options when dialog opens
  useEffect(() => {
    console.log("Dialog open state changed to:", open);
    if (open) {
      console.log("Dialog is open, fetching branches...");
      fetchBranches();
      fetchRoleOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare user data
      const userData = {
        fullName,
        email,
        password,
        role,
        branchId: branchId || null, // Send null if no branch selected
      };

      console.log("Creating user with data:", userData);

      // Call API to create user
      await apiClient.users.create(userData);

      toast({
        title: "Success",
        description: "User created successfully",
      });

      // Reset form and close dialog
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("STAFF");
      setBranchId("");
      onOpenChange(false);

    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.length === 0 ? (
                  <SelectItem value={role} disabled>Loading roles...</SelectItem>
                ) : (
                  roleOptions.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {(role === "MANAGER" || role === "STAFF") && (
            <div className="space-y-2">
              <Label>Assign to Branch *</Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.length === 0 ? (
                    <SelectItem value="none" disabled>No branches available</SelectItem>
                  ) : (
                    branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {role !== "MANAGER" && role !== "STAFF" && (
            <div className="space-y-2">
              <Label>Assign to Branch (Optional)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
                <SelectContent>
                  {branches.length === 0 ? (
                    <SelectItem value="none" disabled>No branches available</SelectItem>
                  ) : (
                    branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
