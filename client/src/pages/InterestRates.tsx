import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Button from "@/vendor/facit/components/bootstrap/Button";
import { FormModal } from "@/components/facit/FormModal";
import FormGroup from "@/vendor/facit/components/bootstrap/forms/FormGroup";
import Input from "@/vendor/facit/components/bootstrap/forms/Input";
import Select from "@/vendor/facit/components/bootstrap/forms/Select";
import Option from "@/vendor/facit/components/bootstrap/Option";
import Checks from "@/vendor/facit/components/bootstrap/forms/Checks";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { t } from "@/lib/lang";

type InterestRate = {
  id: string;
  name: string;
  ratePercent: number;
  firstMonthRatePercent?: number;
  isActive: boolean;
  isDefault: boolean;
};

export default function InterestRates() {
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [firstMonthRatePercent, setFirstMonthRatePercent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [targetDeactivateRate, setTargetDeactivateRate] = useState<InterestRate | null>(null);
  const [replacementDefaultRateId, setReplacementDefaultRateId] = useState("");
  const [replacing, setReplacing] = useState(false);

  const activeRates = useMemo(() => rates.filter((r) => r.isActive), [rates]);
  const replacementCandidates = useMemo(
    () => activeRates.filter((r) => r.id !== targetDeactivateRate?.id),
    [activeRates, targetDeactivateRate]
  );

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getAll();
      setRates(data);
    } catch (error) {
      console.error("Failed to fetch interest rates:", error);
      notify({ title: t("ERROR"), description: "Failed to fetch interest rates", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAdd = async () => {
    if (!name || !ratePercent) {
      notify({ title: t("VALIDATION_ERROR"), description: t("PLEASE_FILL_IN_ALL_REQUIRED_FIELDS"), variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const shouldBeDefault = activeRates.length === 0 ? true : isDefault;
      await apiClient.interestRates.create({
        name,
        ratePercent: parseFloat(ratePercent),
        firstMonthRatePercent: firstMonthRatePercent ? parseFloat(firstMonthRatePercent) : undefined,
        isActive: true,
        isDefault: shouldBeDefault,
      });

      notify({
        title: t("SUCCESS"),
        description: shouldBeDefault ? t("INTEREST_RATE_CREATED_AS_DEFAULT") : t("INTEREST_RATE_CREATED_SUCCESSFULLY"),
        variant: "success",
      });

      setShowDialog(false);
      setName("");
      setRatePercent("");
      setFirstMonthRatePercent("");
      setIsDefault(false);
      fetchRates();
    } catch (error) {
      console.error("Error creating interest rate:", error);
      const message = error instanceof Error ? error.message : "Failed to create interest rate";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rate: InterestRate) => {
    try {
      if (rate.isActive && rate.isDefault) {
        if (replacementCandidates.length === 0) {
          notify({ title: t("CANNOT_DEACTIVATE"), description: t("CREATE_OR_ACTIVATE_ANOTHER_RATE"), variant: "destructive" });
          return;
        }
        setTargetDeactivateRate(rate);
        setReplacementDefaultRateId("");
        setShowReplaceDialog(true);
        return;
      }

      await apiClient.interestRates.toggleActive(rate.id);
      notify({ title: "Success", description: `Interest rate ${rate.isActive ? "deactivated" : "activated"} successfully`, variant: "success" });
      fetchRates();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update interest rate status";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const setAsDefault = async (rate: InterestRate) => {
    if (!rate.isActive) {
      notify({ title: t("CANNOT_SET_DEFAULT"), description: t("ONLY_ACTIVE_RATES_CAN_BE_SET_AS_DEFAULT"), variant: "destructive" });
      return;
    }

    if (rate.isDefault) {
      notify({ title: t("ALREADY_DEFAULT"), description: t("THIS_RATE_IS_ALREADY_DEFAULT") });
      return;
    }

    try {
      await apiClient.interestRates.update(rate.id, {
        name: rate.name,
        ratePercent: rate.ratePercent,
        firstMonthRatePercent: rate.firstMonthRatePercent,
        isActive: rate.isActive,
        isDefault: true,
      });

      notify({ title: "Success", description: `${rate.name} is now the default rate`, variant: "success" });
      fetchRates();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set default rate";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const confirmDeactivateDefault = async () => {
    if (!targetDeactivateRate || !replacementDefaultRateId) {
      notify({ title: t("VALIDATION_ERROR"), description: "Please select another active rate as default", variant: "destructive" });
      return;
    }

    setReplacing(true);
    try {
      await apiClient.interestRates.toggleActive(targetDeactivateRate.id, replacementDefaultRateId);
      notify({ title: t("SUCCESS"), description: t("DEFAULT_RATE_CHANGED"), variant: "success" });
      setShowReplaceDialog(false);
      setTargetDeactivateRate(null);
      setReplacementDefaultRateId("");
      fetchRates();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate default rate";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setReplacing(false);
    }
  };

  const columns: DataTableColumn<InterestRate>[] = [
    { key: "name", header: t("NAME") },
    { key: "ratePercent", header: t("RATE_PERCENT"), render: (r) => `${r.ratePercent}%` },
    { key: "firstMonthRatePercent", header: t("FIRST_MONTH_PERCENT"), render: (r) => `${(r.firstMonthRatePercent ?? r.ratePercent / 12).toFixed(2)}%` },
    {
      key: "isDefault",
      header: t("DEFAULT"),
      render: (r) => (r.isDefault && r.isActive ? <Badge color="primary">{t("DEFAULT")}</Badge> : <Badge color="secondary" isLight>{t("NA")}</Badge>),
    },
    {
      key: "isActive",
      header: t("STATUS"),
      render: (r) => <Badge color={r.isActive ? "success" : "secondary"} isLight>{r.isActive ? t("ACTIVE") : t("INACTIVE")}</Badge>,
    },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (r) => (
        <>
          <Button color="dark" isLight icon="Power" className="me-1" onClick={() => toggleActive(r)} title={r.isActive ? "Deactivate" : "Activate"} aria-label="Toggle active" />
          <Button
            color={r.isDefault ? "warning" : "dark"}
            isLight
            icon="Star"
            onClick={() => setAsDefault(r)}
            isDisable={!r.isActive || r.isDefault}
            title="Set as default"
            aria-label="Set as default"
          />
        </>
      ),
    },
  ];

  return (
    <PageWrapper title={t("INTEREST_RATE_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("INTEREST_RATE_MANAGEMENT"), to: "/interest-rates" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="primary" icon="Add" onClick={() => setShowDialog(true)}>
            {t("ADD_RATE")}
          </Button>
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={rates} keyField={(r) => r.id} emptyMessage={t("NO_INTEREST_RATES_FOUND")} />
          </CardBody>
        </Card>
      </Page>

      <FormModal
        isOpen={showDialog}
        setIsOpen={setShowDialog}
        title={t("CREATE_INTEREST_RATE")}
        onSubmit={handleAdd}
        isSubmitting={saving}
        submitLabel={t("CREATE_RATE")}
      >
        <p className="text-muted small mb-0">
          {activeRates.length === 0
            ? "This will be set as default automatically because this is the first active rate."
            : "Choose whether this new rate should become the default active rate."}
        </p>
        <FormGroup id="rateName" label={t("RATE_NAME")} isFloating>
          <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required placeholder="e.g. Standard Rate" />
        </FormGroup>
        <FormGroup id="ratePercent" label={t("RATE_PERCENT_LABEL")} isFloating>
          <Input type="number" step={0.01} value={ratePercent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRatePercent(e.target.value)} required />
        </FormGroup>
        <FormGroup id="firstMonthRatePercent" label={t("FIRST_MONTH_RATE_PERCENT")} isFloating>
          <Input
            type="number"
            step={0.01}
            value={firstMonthRatePercent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstMonthRatePercent(e.target.value)}
            placeholder={t("DEFAULTS_TO_RATE_DIVIDED_12")}
          />
        </FormGroup>
        {activeRates.length > 0 && (
          <Checks
            id="set-default"
            label={t("SET_AS_DEFAULT_ACTIVE_RATE")}
            checked={isDefault}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDefault(e.target.checked)}
          />
        )}
      </FormModal>

      <FormModal
        isOpen={showReplaceDialog}
        setIsOpen={(open) => {
          setShowReplaceDialog(open);
          if (!open) {
            setTargetDeactivateRate(null);
            setReplacementDefaultRateId("");
          }
        }}
        title={t("SELECT_REPLACEMENT_DEFAULT")}
        onSubmit={confirmDeactivateDefault}
        isSubmitting={replacing}
        submitLabel={t("CONFIRM")}
      >
        <p className="text-muted small mb-0">{t("DEACTIVATING_DEFAULT_RATE_MSG")}</p>
        <FormGroup id="replacementDefaultRateId" label={t("NEW_DEFAULT_RATE")}>
          <Select
            ariaLabel={t("NEW_DEFAULT_RATE")}
            value={replacementDefaultRateId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReplacementDefaultRateId(e.target.value)}
            placeholder={t("SELECT_REPLACEMENT_DEFAULT_RATE")}
          >
            {replacementCandidates.map((r) => (
              <Option key={r.id} value={r.id}>{`${r.name} - ${r.ratePercent}%`}</Option>
            ))}
          </Select>
        </FormGroup>
      </FormModal>
    </PageWrapper>
  );
}
