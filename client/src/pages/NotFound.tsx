import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { t } from "@/lib/lang";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("404_TITLE")}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("PAGE_NOT_FOUND")}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t("RETURN_TO_HOME")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
