import { useState, useEffect } from "react";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";

interface RoleData {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  isSystem: boolean;
}

interface Props {
  role: RoleData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRoleDialog({ role, open, onOpenChange, onSuccess }: Props) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && role) {
      setLabel(role.label);
      setDescription(role.description || "");
    }
  }, [open, role]);

  const handleSubmit = async () => {
    if (!role) return;
    setLoading(true);
    try {
      await apiClient.roles.update(role.id, { label, description: description || undefined });
      notify({ title: "Success", description: "Role updated successfully", variant: "success" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={open}
      setIsOpen={onOpenChange}
      title="Edit Role"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Save Changes"
    >
      <FormGroup id="editRoleName" label="Role Name (identifier)" isFloating formText="Names cannot be changed once created.">
        <Input value={role?.name || ""} disabled />
      </FormGroup>
      <FormGroup id="editRoleLabel" label="Display Label" isFloating>
        <Input value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} required />
      </FormGroup>
      <FormGroup id="editRoleDescription" label="Description (optional)" isFloating>
        <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
      </FormGroup>
    </FormModal>
  );
}
