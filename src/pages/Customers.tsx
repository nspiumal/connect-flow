import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

export default function Customers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [blacklistStatus, setBlacklistStatus] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    const { data } = await supabase
      .from("pawn_transactions")
      .select("customer_name, customer_nic, customer_phone, customer_type, status, pawn_id, loan_amount, pawn_date")
      .or(`customer_name.ilike.%${query}%,customer_nic.ilike.%${query}%`)
      .order("created_at", { ascending: false });
    if (data) {
      setResults(data);
      // Check blacklist
      const nics = [...new Set(data.map((d) => d.customer_nic))];
      const { data: blacklisted } = await supabase.from("blacklist").select("customer_nic").in("customer_nic", nics).eq("is_active", true);
      const status: Record<string, boolean> = {};
      blacklisted?.forEach((b) => { status[b.customer_nic] = true; });
      setBlacklistStatus(status);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Search</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by NIC or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pawn ID</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blacklist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.customer_name}</TableCell>
                  <TableCell>{r.customer_nic}</TableCell>
                  <TableCell>{r.customer_phone}</TableCell>
                  <TableCell><Badge variant="outline">{r.customer_type}</Badge></TableCell>
                  <TableCell className="font-mono">{r.pawn_id}</TableCell>
                  <TableCell>{Number(r.loan_amount).toLocaleString()}</TableCell>
                  <TableCell><Badge>{r.status}</Badge></TableCell>
                  <TableCell>
                    {blacklistStatus[r.customer_nic] ? (
                      <Badge variant="destructive">Blacklisted</Badge>
                    ) : (
                      <Badge variant="secondary">Clear</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Search for customers by NIC or name</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
