import { useState } from "react";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.roles.create({ name, label, description: description || undefined });
      notify({ title: "Success", description: "Role created successfully", variant: "success" });
      setName("");
      setLabel("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create role";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={open}
      setIsOpen={onOpenChange}
      title="Create New Role"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Create Role"
    >
      <FormGroup id="roleName" label="Role Name (identifier)" isFloating formText="Stored upper-case; cannot be changed once users are assigned.">
        <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required placeholder="e.g. AUDITOR" />
      </FormGroup>
      <FormGroup id="roleLabel" label="Display Label" isFloating>
        <Input value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} required placeholder="e.g. Auditor" />
      </FormGroup>
      <FormGroup id="roleDescription" label="Description (optional)" isFloating>
        <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
      </FormGroup>
    </FormModal>
  );
}
