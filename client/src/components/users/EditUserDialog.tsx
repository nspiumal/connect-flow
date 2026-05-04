import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";

type AppRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "STAFF";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  branchId?: string;
}

interface Props {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("STAFF");
  const [branchId, setBranchId] = useState("none");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBranches = async () => {
    try {
      const data = await apiClient.branches.getActive();
      const normalized = data.map((b: any) => ({
        id: b.id,
        name: b.name,
      }));
      setBranches(normalized);
    } catch (error: any) {
      console.error("Failed to fetch branches:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBranches();
      if (user) {
        setFullName(user.full_name);
        setEmail(user.email);
        setRole((user.roles[0] as AppRole) || "STAFF");
        setBranchId(user.branchId || "none");
        setPassword(""); // don't pre-fill password
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const userData: any = {
        fullName,
        email,
        role,
        branchId: branchId === "none" ? null : branchId,
      };
      
      if (password) {
        userData.password = password;
      }

      await apiClient.users.update(user.id, userData);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label>New Password (Optional)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Leave blank to keep unchanged" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Branch Manager</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(role === "MANAGER" || role === "STAFF") && (
            <div className="space-y-2">
              <Label>Assign to Branch *</Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(role === "SUPERADMIN" || role === "ADMIN") && (
            <div className="space-y-2">
              <Label>Assign to Branch (Optional)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
