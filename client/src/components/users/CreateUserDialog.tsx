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
  const branches = useBranchOptions();
  const roleOptions = useActiveRoleOptions();
  const [loading, setLoading] = useState(false);

  // Default the role select to the first active role once loaded, same as before.
  useEffect(() => {
    if (roleOptions.length > 0 && !roleOptions.some((r) => r.name === role)) {
      setRole(roleOptions[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleOptions]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.users.create({
        fullName,
        email,
        password,
        role,
        branchId: branchId || null,
      });

      notify({ title: "Success", description: "User created successfully", variant: "success" });

      setEmail("");
      setFullName("");
      setPassword("");
      setRole("STAFF");
      setBranchId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      const message = error instanceof Error ? error.message : "Failed to create user";
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
      title="Create New User"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Create User"
    >
      <FormGroup id="fullName" label="Full Name" isFloating>
        <Input value={fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} required />
      </FormGroup>
      <FormGroup id="email" label="Email" isFloating>
        <Input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
      </FormGroup>
      <FormGroup id="password" label="Password" isFloating>
        <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required minLength={6} />
      </FormGroup>
      <FormGroup id="role" label="Role">
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
      <FormGroup id="branchId" label={needsBranch ? "Assign to Branch *" : "Assign to Branch (Optional)"}>
        <Select
          ariaLabel="Branch"
          value={branchId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
          required={needsBranch}
          placeholder={needsBranch ? "Select branch" : "Select branch (optional)"}
        >
          {branches.length === 0 ? (
            <Option value="" disabled>No branches available</Option>
          ) : (
            branches.map((b) => (
              <Option key={b.id} value={b.id}>{b.name}</Option>
            ))
          )}
        </Select>
      </FormGroup>
    </FormModal>
  );
}
