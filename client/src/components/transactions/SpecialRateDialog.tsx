import { useState, useEffect, useId } from "react";
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/vendor/facit/components/bootstrap/Modal";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import Alert from "@/vendor/facit/components/bootstrap/Alert";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";

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
  const [managerUserId, setManagerUserId] = useState<string>("");
  const titleId = `special-rate-title-${useId()}`;

  useEffect(() => {
    if (open) {
      checkManagerPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const checkManagerPin = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        notify({ title: "Error", description: "Could not determine manager ID", variant: "destructive" });
        return;
      }

      setManagerUserId(userId);

      const result = await apiClient.users.hasPinSet(userId);

      if (!result.hasPinSet) {
        notify({ title: "PIN Not Set", description: "You must set a PIN before applying special rates", variant: "destructive" });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to check PIN status:", error);
      notify({ title: "Error", description: "Failed to check PIN status", variant: "destructive" });
    }
  };

  const handleApplyRate = () => {
    if (!specialRate || parseFloat(specialRate) < 0) {
      notify({ title: "Validation Error", description: "Please enter a valid special rate", variant: "destructive" });
      return;
    }

    if (parseFloat(specialRate) >= 100) {
      notify({ title: "Validation Error", description: "Special rate cannot be 100% or higher", variant: "destructive" });
      return;
    }

    setStep("verify");
  };

  const handleVerifyPin = async () => {
    if (!pinVerification.trim()) {
      notify({ title: "Validation Error", description: "Please enter your PIN", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const result = await apiClient.users.verifyPin(managerUserId, pinVerification);

      if (!result.valid) {
        notify({ title: "Invalid PIN", description: "The PIN you entered is incorrect", variant: "destructive" });
        return;
      }

      // NOTE: this previously called a nonexistent apiClient.pawnTransactions.updateSpecialRate,
      // which would throw at runtime — the feature was completely broken. updateDetails with
      // interestRatePercent is the real, working endpoint (see TransactionEdit.tsx's identical use).
      await apiClient.pawnTransactions.updateDetails(transactionId, {
        interestRatePercent: parseFloat(specialRate),
      });

      notify({ title: "Success", description: `Special rate of ${specialRate}% applied successfully`, variant: "success" });

      setSpecialRate(String(currentRate));
      setPinVerification("");
      setStep("rate");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to apply special rate:", error);
      const message = error instanceof Error ? error.message : "Failed to apply special rate";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} setIsOpen={onOpenChange} titleId={titleId} isCentered size="sm">
      <ModalHeader setIsOpen={onOpenChange}>
        <ModalTitle id={titleId}>Apply Special Rate</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-muted small mb-3">Set a custom interest rate for this customer</p>

        {step === "rate" && (
          <>
            <FormGroup id="currentRate" label="Current Rate" isFloating className="mb-3" formText="Current interest rate for this transaction">
              <Input type="number" value={currentRate} disabled step={0.01} />
            </FormGroup>

            <FormGroup id="specialRate" label="Special Rate (%)" isFloating className="mb-3" formText="Enter the new interest rate percentage (0-99.99%)">
              <Input
                type="number"
                placeholder="Enter special rate percentage"
                value={specialRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialRate(e.target.value)}
                step={0.01}
                min={0}
                max={99.99}
                disabled={loading}
              />
            </FormGroup>

            {parseFloat(specialRate) < parseFloat(String(currentRate)) && (
              <Alert color="info" isLight icon="Info" className="mb-3">
                This rate is lower than the current rate. PIN verification is required to apply.
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button
                color="dark"
                isLight
                onClick={() => { setSpecialRate(String(currentRate)); onOpenChange(false); }}
                isDisable={loading}
              >
                Cancel
              </Button>
              <Button color="primary" onClick={handleApplyRate} isDisable={loading}>
                {loading ? "Processing..." : "Next: Verify PIN"}
              </Button>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <Alert color="info" isLight className="mb-3">
              <p className="fw-medium mb-0">
                Applying Special Rate: <span className="fw-bold fs-5">{specialRate}%</span>
              </p>
              <p className="small mb-0 mt-1">PIN verification required to confirm</p>
            </Alert>

            <FormGroup id="pin" label="Enter Your PIN" isFloating className="mb-3" formText="Your PIN is required to apply special rates">
              <Input
                type="password"
                placeholder="Enter your 4-6 digit PIN"
                value={pinVerification}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPinVerification(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2">
              <Button color="dark" isLight onClick={() => { setPinVerification(""); setStep("rate"); }} isDisable={loading}>
                Back
              </Button>
              <Button color="primary" onClick={handleVerifyPin} isDisable={loading} icon="Lock">
                {loading && <Spinner isSmall inButton />}
                {loading ? "Verifying..." : "Verify & Apply"}
              </Button>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
