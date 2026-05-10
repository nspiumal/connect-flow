import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";

interface AddItemTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newItemType: any) => void;
}

export function AddItemTypeDialog({ open, onOpenChange, onSuccess }: AddItemTypeDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Item type name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newItemType = await apiClient.itemTypes.create({
        name: name.trim(),
        description: description.trim() || null,
      });

      toast({
        title: "Success",
        description: `Item type "${name}" created successfully`,
      });

      setName("");
      setDescription("");
      onSuccess(newItemType);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create item type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create item type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item Type</DialogTitle>
          <DialogDescription>
            Create a new gold item type that will be available for all transactions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-type-name">Name *</Label>
            <Input
              id="item-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bracelet, Pendant, etc."
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-type-description">Description (Optional)</Label>
            <Textarea
              id="item-type-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this item type"
              disabled={loading}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Item Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
