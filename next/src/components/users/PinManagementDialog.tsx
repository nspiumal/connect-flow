import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

interface PinManagementDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PinManagementDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}: PinManagementDialogProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [mode, setMode] = useState<"set" | "verify" | "change">("set");
  const [currentPin, setCurrentPin] = useState("");
  const { toast } = useToast();

  // Check if user has PIN set
  useEffect(() => {
    if (open) {
      checkPinStatus();
    }
  }, [open, userId]);

  const checkPinStatus = async () => {
    try {
      const result = await apiClient.users.hasPinSet(userId);
      setHasPinSet(result.hasPinSet);
      setMode(result.hasPinSet ? "change" : "set");
    } catch (error) {
      console.error("Failed to check PIN status:", error);
    }
  };

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      toast({
        title: "Validation Error",
        description: "Please enter and confirm the PIN",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "Validation Error",
        description: "PINs do not match",
        variant: "destructive",
      });
      return;
    }

    if (!pin.match(/^\d{4,6}$/)) {
      toast({
        title: "Validation Error",
        description: "PIN must be 4-6 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.users.setPin(userId, pin);
      toast({
        title: "Success",
        description: "PIN has been set successfully",
      });
      setPin("");
      setConfirmPin("");
      setHasPinSet(true);
      setMode("change");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !pin || !confirmPin) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // First verify current PIN
    try {
      setLoading(true);
      await apiClient.users.verifyPin(userId, currentPin);

      // If verified, set new PIN
      if (pin !== confirmPin) {
        toast({
          title: "Validation Error",
          description: "New PINs do not match",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!pin.match(/^\d{4,6}$/)) {
        toast({
          title: "Validation Error",
          description: "PIN must be 4-6 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await apiClient.users.setPin(userId, pin);
      toast({
        title: "Success",
        description: "PIN has been changed successfully",
      });
      setCurrentPin("");
      setPin("");
      setConfirmPin("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin) {
      toast({
        title: "Validation Error",
        description: "Please enter the PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.users.verifyPin(userId, pin);
      if (result.valid) {
        toast({
          title: "Success",
          description: "PIN is correct",
        });
        setPin("");
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid PIN",
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
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            PIN Management
          </DialogTitle>
          <DialogDescription>
            Manage PIN for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "set" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin">Set PIN (4-6 digits)</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  PIN must be 4-6 digits. This will be used for special operations.
                </p>
              </div>
            </>
          )}

          {mode === "verify" && (
            <div className="space-y-2">
              <Label htmlFor="pin">Enter PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </div>
          )}

          {mode === "change" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input
                  id="currentPin"
                  type="password"
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN (4-6 digits)</Label>
                <Input
                  id="newPin"
                  type="password"
                  placeholder="Enter new PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
                <Input
                  id="confirmNewPin"
                  type="password"
                  placeholder="Confirm new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setPin("");
                setConfirmPin("");
                setCurrentPin("");
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (mode === "set") handleSetPin();
                else if (mode === "verify") handleVerifyPin();
                else handleChangePin();
              }}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>Processing...</>
              ) : mode === "set" ? (
                <>
                  <Lock className="h-4 w-4" />
                  Set PIN
                </>
              ) : mode === "verify" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verify PIN
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Change PIN
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

