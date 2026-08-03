import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Button from "@/vendor/facit/components/bootstrap/Button";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import Icon from "@/vendor/facit/components/icon/Icon";
import { notify } from "@/components/facit/notify";
import { t } from "@/lib/lang";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("INVALID_CREDENTIALS");
      notify({
        title: t("LOGIN_FAILED"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{ background: "linear-gradient(135deg, #1f2128 0%, #303d4f 60%, #1f2128 100%)" }}
    >
      <Card className="w-100 shadow-lg border-0" style={{ maxWidth: 420 }}>
        <CardBody className="p-4 p-sm-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 shadow mb-3"
              style={{ width: 56, height: 56, background: "linear-gradient(135deg, var(--bs-primary), var(--bs-info))" }}
            >
              <Icon icon="Diamond" size="2x" color="light" />
            </div>
            <h2 className="fw-bold mb-1">{t("CONNECT_FLOW")}</h2>
            <p className="text-muted">{t("GOLD_PAWN_MANAGEMENT_SYSTEM")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <FormGroup id="email" label={t("EMAIL_ADDRESS")} className="mb-3">
              <Input
                type="email"
                placeholder={t("YOU_AT_EXAMPLE_DOT_COM")}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup id="password" label={t("PASSWORD")} className="mb-3">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </FormGroup>
            <Button type="submit" color="primary" className="w-100 fw-semibold" isDisable={isLoading}>
              {isLoading && <Spinner isSmall inButton />}
              {isLoading ? t("SIGNING_IN") : t("SIGN_IN")}
            </Button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">{t("COPYRIGHT_CONNECT_FLOW")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
