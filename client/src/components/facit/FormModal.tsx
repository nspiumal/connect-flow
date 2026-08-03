import { ReactNode, useId } from "react";
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/vendor/facit/components/bootstrap/Modal";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import { TModalSize } from "@/vendor/facit/type/modal-type";

interface FormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  size?: TModalSize;
  children: ReactNode;
}

/**
 * Replaces the Dialog + <form> + loading-button + manual-reset scaffold
 * duplicated across CreateUserDialog/EditUserDialog/CreateRoleDialog/
 * AddItemTypeDialog/SpecialRateDialog/PinManagementDialog/etc.
 */
export function FormModal({
  isOpen,
  setIsOpen,
  title,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  size,
  children,
}: FormModalProps) {
  const titleId = `form-modal-title-${useId()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} titleId={titleId} size={size} isCentered isScrollable>
      <ModalHeader setIsOpen={setIsOpen}>
        <ModalTitle id={titleId}>{title}</ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="d-flex flex-column gap-3">{children}</div>
        </ModalBody>
        <ModalFooter>
          <Button color="dark" isLight onClick={() => setIsOpen(false)} isDisable={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" color="primary" isDisable={isSubmitting}>
            {isSubmitting && <Spinner isSmall inButton />}
            {submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
