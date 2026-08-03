import { useState, useEffect, useId } from "react";
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/vendor/facit/components/bootstrap/Modal";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import Alert from "@/vendor/facit/components/bootstrap/Alert";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";

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
  const [mode, setMode] = useState<"set" | "verify" | "change">("set");
  const [currentPin, setCurrentPin] = useState("");
  const titleId = `pin-modal-title-${useId()}`;

  // Check if user has PIN set
  useEffect(() => {
    if (open) {
      checkPinStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const checkPinStatus = async () => {
    try {
      const result = await apiClient.users.hasPinSet(userId);
      setMode(result.hasPinSet ? "change" : "set");
    } catch (error) {
      console.error("Failed to check PIN status:", error);
    }
  };

  const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      notify({ title: "Validation Error", description: "Please enter and confirm the PIN", variant: "destructive" });
      return;
    }
    if (pin !== confirmPin) {
      notify({ title: "Validation Error", description: "PINs do not match", variant: "destructive" });
      return;
    }
    if (!pin.match(/^\d{4,6}$/)) {
      notify({ title: "Validation Error", description: "PIN must be 4-6 digits", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await apiClient.users.setPin(userId, pin);
      notify({ title: "Success", description: "PIN has been set successfully", variant: "success" });
      setPin("");
      setConfirmPin("");
      setMode("change");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      notify({ title: "Error", description: errorMessage(error, "Failed to set PIN"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !pin || !confirmPin) {
      notify({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await apiClient.users.verifyPin(userId, currentPin);

      if (pin !== confirmPin) {
        notify({ title: "Validation Error", description: "New PINs do not match", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!pin.match(/^\d{4,6}$/)) {
        notify({ title: "Validation Error", description: "PIN must be 4-6 digits", variant: "destructive" });
        setLoading(false);
        return;
      }

      await apiClient.users.setPin(userId, pin);
      notify({ title: "Success", description: "PIN has been changed successfully", variant: "success" });
      setCurrentPin("");
      setPin("");
      setConfirmPin("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      notify({ title: "Error", description: errorMessage(error, "Failed to change PIN"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin) {
      notify({ title: "Validation Error", description: "Please enter the PIN", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.users.verifyPin(userId, pin);
      if (result.valid) {
        notify({ title: "Success", description: "PIN is correct", variant: "success" });
        setPin("");
        onOpenChange(false);
      }
    } catch (error) {
      notify({ title: "Error", description: errorMessage(error, "Invalid PIN"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (mode === "set") handleSetPin();
    else if (mode === "verify") handleVerifyPin();
    else handleChangePin();
  };

  const handleCancel = () => {
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    onOpenChange(false);
  };

  return (
    <Modal isOpen={open} setIsOpen={onOpenChange} titleId={titleId} isCentered size="sm">
      <ModalHeader setIsOpen={onOpenChange}>
        <ModalTitle id={titleId}>
          <span className="d-inline-flex align-items-center gap-2">PIN Management</span>
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-muted small mb-3">Manage PIN for {userName}</p>

        {mode === "set" && (
          <>
            <FormGroup id="pin" label="Set PIN (4-6 digits)" isFloating className="mb-3">
              <Input type="password" placeholder="Enter PIN" value={pin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)} maxLength={6} disabled={loading} />
            </FormGroup>
            <FormGroup id="confirmPin" label="Confirm PIN" isFloating className="mb-3">
              <Input type="password" placeholder="Confirm PIN" value={confirmPin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPin(e.target.value)} maxLength={6} disabled={loading} />
            </FormGroup>
            <Alert color="info" isLight icon="Info">
              PIN must be 4-6 digits. This will be used for special operations.
            </Alert>
          </>
        )}

        {mode === "verify" && (
          <FormGroup id="verifyPin" label="Enter PIN" isFloating>
            <Input type="password" placeholder="Enter PIN" value={pin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)} maxLength={6} disabled={loading} />
          </FormGroup>
        )}

        {mode === "change" && (
          <>
            <FormGroup id="currentPin" label="Current PIN" isFloating className="mb-3">
              <Input type="password" placeholder="Enter current PIN" value={currentPin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPin(e.target.value)} maxLength={6} disabled={loading} />
            </FormGroup>
            <FormGroup id="newPin" label="New PIN (4-6 digits)" isFloating className="mb-3">
              <Input type="password" placeholder="Enter new PIN" value={pin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)} maxLength={6} disabled={loading} />
            </FormGroup>
            <FormGroup id="confirmNewPin" label="Confirm New PIN" isFloating>
              <Input type="password" placeholder="Confirm new PIN" value={confirmPin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPin(e.target.value)} maxLength={6} disabled={loading} />
            </FormGroup>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="dark" isLight onClick={handleCancel} isDisable={loading}>
          Cancel
        </Button>
        <Button color="primary" onClick={handleAction} isDisable={loading} icon={loading ? undefined : "Lock"}>
          {loading && <Spinner isSmall inButton />}
          {loading ? "Processing..." : mode === "set" ? "Set PIN" : mode === "verify" ? "Verify PIN" : "Change PIN"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
