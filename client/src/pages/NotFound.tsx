import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { t } from "@/lib/lang";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body-tertiary">
      <div className="text-center">
        <h1 className="display-3 fw-bold mb-3">{t("404_TITLE")}</h1>
        <p className="fs-4 text-muted mb-4">{t("PAGE_NOT_FOUND")}</p>
        <Button color="primary" tag="a" to="/">
          {t("RETURN_TO_HOME")}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
