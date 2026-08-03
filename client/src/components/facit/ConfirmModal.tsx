import { ReactNode, useId } from "react";
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/vendor/facit/components/bootstrap/Modal";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import { TColor } from "@/vendor/facit/type/color-type";

interface ConfirmModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  message: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: TColor;
  isSubmitting?: boolean;
}

/** Standalone confirm/cancel dialog for destructive or irreversible actions. */
export function ConfirmModal({
  isOpen,
  setIsOpen,
  title,
  message,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "danger",
  isSubmitting = false,
}: ConfirmModalProps) {
  const titleId = `confirm-modal-title-${useId()}`;

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} titleId={titleId} isCentered size="sm">
      <ModalHeader setIsOpen={setIsOpen}>
        <ModalTitle id={titleId}>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button color="dark" isLight onClick={() => setIsOpen(false)} isDisable={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button color={confirmColor} onClick={onConfirm} isDisable={isSubmitting}>
          {isSubmitting && <Spinner isSmall inButton />}
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
