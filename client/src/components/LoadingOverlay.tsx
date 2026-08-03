import React from 'react';
import { t } from "@/lib/lang";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Full-page loading overlay shown during auth/session checks.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading..."
}) => {
  if (!isLoading) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,.5)", zIndex: 1050 }}
    >
      <div className="bg-body rounded-3 shadow-lg text-center p-5" style={{ minWidth: 250 }}>
        <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} className="mb-3" />
        <p className="fw-semibold fs-5 mb-1">{message}</p>
        <p className="text-muted small mb-0">{t("PLEASE_WAIT")}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
