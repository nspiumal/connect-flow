import { useState } from "react";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";

interface ItemTypeResult {
  id: string;
  name: string;
  description?: string;
}

interface AddItemTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newItemType: ItemTypeResult) => void;
}

export function AddItemTypeDialog({ open, onOpenChange, onSuccess }: AddItemTypeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      notify({ title: "Validation Error", description: "Item type name is required", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const newItemType: ItemTypeResult = await apiClient.itemTypes.create({
        name: name.trim(),
        description: description.trim() || null,
      });

      notify({ title: "Success", description: `Item type "${name}" created successfully`, variant: "success" });

      setName("");
      setDescription("");
      onSuccess(newItemType);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create item type:", error);
      const message = error instanceof Error ? error.message : "Failed to create item type";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={open}
      setIsOpen={onOpenChange}
      title="Add New Item Type"
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitLabel="Create Item Type"
    >
      <p className="text-muted small mb-0">Create a new gold item type that will be available for all transactions.</p>
      <FormGroup id="newItemTypeName" label="Name *" isFloating>
        <Input
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g., Bracelet, Pendant, etc."
          disabled={loading}
          autoFocus
        />
      </FormGroup>
      <FormGroup id="newItemTypeDescription" label="Description (Optional)" isFloating>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe this item type"
          disabled={loading}
          rows={3}
        />
      </FormGroup>
    </FormModal>
  );
}
