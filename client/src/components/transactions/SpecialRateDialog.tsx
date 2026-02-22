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
import { AlertCircle, Lock, TrendingDown } from "lucide-react";

interface SpecialRateDialogProps {
  transactionId: string;
  customerId: string;
  currentRate: number;
  prefilledRate?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SpecialRateDialog({
  transactionId,
  customerId,
  currentRate,
  prefilledRate,
  open,
  onOpenChange,
  onSuccess,
}: SpecialRateDialogProps) {
  const [specialRate, setSpecialRate] = useState(String(prefilledRate || currentRate));
  const [pinVerification, setPinVerification] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"rate" | "verify">(prefilledRate ? "verify" : "rate");
  const [hasManagerPin, setHasManagerPin] = useState(false);
  const [managerUserId, setManagerUserId] = useState<string>("");
  const { toast } = useToast();

  // Check if manager has PIN set
  useEffect(() => {
    if (open) {
      checkManagerPin();
    }
  }, [open]);

  const checkManagerPin = async () => {
    try {
      // Get current manager's ID from localStorage or context
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast({
          title: "Error",
          description: "Could not determine manager ID",
          variant: "destructive",
        });
        return;
      }

      setManagerUserId(userId);

      // Check if manager has PIN set
      const result = await apiClient.users.hasPinSet(userId);
      setHasManagerPin(result.hasPinSet);

      if (!result.hasPinSet) {
        toast({
          title: "PIN Not Set",
          description: "You must set a PIN before applying special rates",
          variant: "destructive",
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Failed to check PIN status:", error);
      toast({
        title: "Error",
        description: "Failed to check PIN status",
        variant: "destructive",
      });
    }
  };

  const handleApplyRate = async () => {
    if (!specialRate || parseFloat(specialRate) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid special rate",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(specialRate) >= 100) {
      toast({
        title: "Validation Error",
        description: "Special rate cannot be 100% or higher",
        variant: "destructive",
      });
      return;
    }

    // Move to PIN verification step
    setStep("verify");
  };

  const handleVerifyPin = async () => {
    if (!pinVerification.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Verify manager's PIN
      const result = await apiClient.users.verifyPin(managerUserId, pinVerification);

      if (!result.valid) {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Apply special rate to transaction
      await apiClient.pawnTransactions.updateSpecialRate(transactionId, {
        specialRate: parseFloat(specialRate),
        customerId: customerId,
      });

      toast({
        title: "Success",
        description: `Special rate of ${specialRate}% applied successfully`,
      });

      // Reset and close
      setSpecialRate(String(currentRate));
      setPinVerification("");
      setStep("rate");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to apply special rate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to apply special rate",
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
            <TrendingDown className="h-5 w-5" />
            Apply Special Rate
          </DialogTitle>
          <DialogDescription>
            Set a custom interest rate for this customer
          </DialogDescription>
        </DialogHeader>

        {step === "rate" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentRate">Current Rate</Label>
              <Input
                id="currentRate"
                type="number"
                value={currentRate}
                disabled
                className="bg-muted"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Current interest rate for this transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRate">Special Rate (%)</Label>
              <Input
                id="specialRate"
                type="number"
                placeholder="Enter special rate percentage"
                value={specialRate}
                onChange={(e) => setSpecialRate(e.target.value)}
                step="0.01"
                min="0"
                max="99.99"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the new interest rate percentage (0-99.99%)
              </p>
            </div>

            {parseFloat(specialRate) < parseFloat(String(currentRate)) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  This rate is lower than the current rate. PIN verification is required to apply.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSpecialRate(String(currentRate));
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyRate}
                disabled={loading}
                className="gap-2"
              >
                {loading ? "Processing..." : "Next: Verify PIN"}
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900">
                Applying Special Rate: <span className="font-bold text-lg">{specialRate}%</span>
              </p>
              <p className="text-xs text-blue-800 mt-1">
                PIN verification required to confirm
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Enter Your PIN
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your 4-6 digit PIN"
                value={pinVerification}
                onChange={(e) => setPinVerification(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your PIN is required to apply special rates
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPinVerification("");
                  setStep("rate");
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyPin}
                disabled={loading}
                className="gap-2"
              >
                {loading ? "Verifying..." : "Verify & Apply"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

