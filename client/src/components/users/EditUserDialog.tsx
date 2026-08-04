import { useState, useEffect } from "react";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { useActiveRoleOptions, useBranchOptions } from "@/hooks/useLookups";

type AppRole = string;

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
  const branches = useBranchOptions();
  const roleOptions = useActiveRoleOptions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole((user.roles[0] as AppRole) || "STAFF");
      setBranchId(user.branchId || "none");
      setPassword(""); // don't pre-fill password
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userData: { fullName: string; email: string; role: AppRole; branchId: string | null; password?: string } = {
        fullName,
        email,
        role,
        branchId: branchId === "none" ? null : branchId,
      };

      if (password) {
        userData.password = password;
      }

      await apiClient.users.update(user.id, userData);

      notify({ title: "Success", description: "User updated successfully", variant: "success" });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const needsBranch = role === "MANAGER" || role === "STAFF";

  return (
    <FormModal
      isOpen={open}
      setIsOpen={onOpenChange}
      title="Edit User"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Update User"
    >
      <FormGroup id="editFullName" label="Full Name" isFloating>
        <Input value={fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} required />
      </FormGroup>
      <FormGroup id="editEmail" label="Email" isFloating formText="Email cannot be changed">
        <Input type="email" value={email} disabled />
      </FormGroup>
      <FormGroup id="editPassword" label="New Password (Optional)" isFloating>
        <Input
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          minLength={6}
          placeholder="Leave blank to keep unchanged"
        />
      </FormGroup>
      <FormGroup id="editRole" label="Role">
        <Select ariaLabel="Role" value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}>
          {roleOptions.length === 0 ? (
            <Option value={role} disabled>Loading roles...</Option>
          ) : (
            roleOptions.map((r) => (
              <Option key={r.name} value={r.name}>{r.label}</Option>
            ))
          )}
        </Select>
      </FormGroup>
      <FormGroup id="editBranchId" label={needsBranch ? "Assign to Branch *" : "Assign to Branch (Optional)"}>
        <Select
          ariaLabel="Branch"
          value={branchId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
          required={needsBranch}
        >
          <Option value="none" disabled={needsBranch}>{needsBranch ? "Select branch" : "No Branch"}</Option>
          {branches.map((b) => (
            <Option key={b.id} value={b.id}>{b.name}</Option>
          ))}
        </Select>
      </FormGroup>
    </FormModal>
  );
}
