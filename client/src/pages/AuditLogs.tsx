import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { t } from "@/lib/lang";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs([]);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{t("AUDIT_LOGS")}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("TIMESTAMP")}</TableHead>
                <TableHead>{t("ACTION")}</TableHead>
                <TableHead>{t("TARGET")}</TableHead>
                <TableHead>{t("DETAILS")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                  <TableCell className="font-medium">{l.action}</TableCell>
                  <TableCell>{l.target_table} {l.target_id ? `#${l.target_id}` : ""}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{l.details ? JSON.stringify(l.details) : "—"}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("NO_AUDIT_LOGS")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
