import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Power, Star } from "lucide-react";
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

  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [targetDeactivateRate, setTargetDeactivateRate] = useState<InterestRate | null>(null);
  const [replacementDefaultRateId, setReplacementDefaultRateId] = useState("");

  const { toast } = useToast();

  const activeRates = useMemo(() => rates.filter((r) => r.isActive), [rates]);
  const replacementCandidates = useMemo(
    () => activeRates.filter((r) => r.id !== targetDeactivateRate?.id),
    [activeRates, targetDeactivateRate]
  );

  const fetchRates = async () => {
    try {
      const data = await apiClient.interestRates.getAll();
      setRates(data);
    } catch (error: any) {
      console.error("Failed to fetch interest rates:", error);
      toast({
        title: t("ERROR"),
        description: "Failed to fetch interest rates",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !ratePercent) {
      toast({
        title: t("VALIDATION_ERROR"),
        description: t("PLEASE_FILL_IN_ALL_REQUIRED_FIELDS"),
        variant: "destructive",
      });
      return;
    }

    try {
      const shouldBeDefault = activeRates.length === 0 ? true : isDefault;
      await apiClient.interestRates.create({
        name,
        ratePercent: parseFloat(ratePercent),
        firstMonthRatePercent: firstMonthRatePercent ? parseFloat(firstMonthRatePercent) : undefined,
        isActive: true,
        isDefault: shouldBeDefault,
      });

      toast({
        title: t("SUCCESS"),
        description: shouldBeDefault
          ? t("INTEREST_RATE_CREATED_AS_DEFAULT")
          : t("INTEREST_RATE_CREATED_SUCCESSFULLY"),
      });

      setShowDialog(false);
      setName("");
      setRatePercent("");
      setFirstMonthRatePercent("");
      setIsDefault(false);
      fetchRates();
    } catch (error: any) {
      console.error("Error creating interest rate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create interest rate",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (rate: InterestRate) => {
    try {
      if (rate.isActive && rate.isDefault) {
        if (replacementCandidates.length === 0) {
        toast({
          title: t("CANNOT_DEACTIVATE"),
          description: t("CREATE_OR_ACTIVATE_ANOTHER_RATE"),
          variant: "destructive",
        });
          return;
        }
        setTargetDeactivateRate(rate);
        setReplacementDefaultRateId("");
        setShowReplaceDialog(true);
        return;
      }

      await apiClient.interestRates.toggleActive(rate.id);
      toast({
        title: "Success",
        description: `Interest rate ${rate.isActive ? "deactivated" : "activated"} successfully`,
      });
      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update interest rate status",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (rate: InterestRate) => {
    if (!rate.isActive) {
      toast({
        title: t("CANNOT_SET_DEFAULT"),
        description: t("ONLY_ACTIVE_RATES_CAN_BE_SET_AS_DEFAULT"),
        variant: "destructive",
      });
      return;
    }

    if (rate.isDefault) {
      toast({
        title: t("ALREADY_DEFAULT"),
        description: t("THIS_RATE_IS_ALREADY_DEFAULT"),
      });
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

      toast({
        title: "Success",
        description: `${rate.name} is now the default rate`,
      });
      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set default rate",
        variant: "destructive",
      });
    }
  };

  const confirmDeactivateDefault = async () => {
    if (!targetDeactivateRate || !replacementDefaultRateId) {
      toast({
        title: t("VALIDATION_ERROR"),
        description: "Please select another active rate as default",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.interestRates.toggleActive(targetDeactivateRate.id, replacementDefaultRateId);
      toast({
        title: t("SUCCESS"),
        description: t("DEFAULT_RATE_CHANGED"),
      });
      setShowReplaceDialog(false);
      setTargetDeactivateRate(null);
      setReplacementDefaultRateId("");
      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate default rate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t("INTEREST_RATE_MANAGEMENT")}</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> {t("ADD_RATE")}</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("NAME")}</TableHead>
                <TableHead>{t("RATE_PERCENT")}</TableHead>
                <TableHead>{t("FIRST_MONTH_PERCENT")}</TableHead>
                <TableHead>{t("DEFAULT")}</TableHead>
                <TableHead>{t("STATUS")}</TableHead>
                <TableHead>{t("ACTIONS")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.ratePercent}%</TableCell>
                  <TableCell>{(r.firstMonthRatePercent ?? r.ratePercent / 12).toFixed(2)}%</TableCell>
                  <TableCell>
                    {r.isDefault && r.isActive ? <Badge>{t("DEFAULT")}</Badge> : <Badge variant="outline">{t("NA")}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? t("ACTIVE") : t("INACTIVE")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(r)}
                        title={r.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(r)}
                        disabled={!r.isActive || r.isDefault}
                        title="Set as default"
                      >
                        <Star className={`h-3 w-3 ${r.isDefault ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("NO_INTEREST_RATES_FOUND")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("CREATE_INTEREST_RATE")}</DialogTitle>
            <DialogDescription>
              {activeRates.length === 0
                ? "This will be set as default automatically because this is the first active rate."
                : "Choose whether this new rate should become the default active rate."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>{t("RATE_NAME")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Standard Rate" />
            </div>
            <div>
              <Label>{t("RATE_PERCENT_LABEL")}</Label>
              <Input type="number" step="0.01" value={ratePercent} onChange={(e) => setRatePercent(e.target.value)} required />
            </div>
            <div>
              <Label>{t("FIRST_MONTH_RATE_PERCENT")}</Label>
              <Input
                type="number"
                step="0.01"
                value={firstMonthRatePercent}
                onChange={(e) => setFirstMonthRatePercent(e.target.value)}
                placeholder={t("DEFAULTS_TO_RATE_DIVIDED_12")}
              />
            </div>

            {activeRates.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox id="set-default" checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
                <Label htmlFor="set-default">{t("SET_AS_DEFAULT_ACTIVE_RATE")}</Label>
              </div>
            )}

            <Button type="submit" className="w-full">
              {t("CREATE_RATE")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("SELECT_REPLACEMENT_DEFAULT")}</DialogTitle>
            <DialogDescription>
              {t("DEACTIVATING_DEFAULT_RATE_MSG")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t("NEW_DEFAULT_RATE")}</Label>
              <Select value={replacementDefaultRateId} onValueChange={setReplacementDefaultRateId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("SELECT_REPLACEMENT_DEFAULT_RATE")} />
                </SelectTrigger>
                <SelectContent>
                  {replacementCandidates.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} - {r.ratePercent}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setTargetDeactivateRate(null);
                  setReplacementDefaultRateId("");
                }}
              >
                {t("CANCEL")}
              </Button>
              <Button onClick={confirmDeactivateDefault}>{t("CONFIRM")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
