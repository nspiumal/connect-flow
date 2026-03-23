import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X } from "lucide-react";

export default function BranchRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const { role } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setRequests([]);
    toast({
      title: "Branch requests",
      description: "Backend endpoint not connected yet.",
    });
  }, [toast]);

  const handleAction = async () => {
    toast({
      title: "Not available",
      description: "Approve/Reject needs backend endpoint.",
      variant: "destructive",
    });
  };

  const statusColor = (s: string) => {
    if (s === "Approved") return "default";
    if (s === "Rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Branch Requests</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.branch_name}</TableCell>
                  <TableCell>{r.branch_address}</TableCell>
                  <TableCell>{r.branch_phone}</TableCell>
                  <TableCell><Badge variant={statusColor(r.status) as any}>{r.status}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    {r.status === "Pending" && role === "SUPERADMIN" && (
                      <>
                        <Button size="sm" variant="outline" onClick={handleAction}><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={handleAction}><X className="h-3 w-3" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No requests</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
