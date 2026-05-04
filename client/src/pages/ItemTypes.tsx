import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { AdvancedSearchPanel, type FilterValue } from "@/components/ui/AdvancedSearchPanel";

interface ItemType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ItemTypes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Pagination and Filter State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search filters
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});

  // Load item types on mount
  useEffect(() => {
    fetchItemTypes(0, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchItemTypes = useCallback(
    async (page: number, searchFilters: Record<string, FilterValue>) => {
      try {
        setLoading(true);

        // Parse filters
        const name = typeof searchFilters.name === "string" ? searchFilters.name : undefined;

        const status = searchFilters.status;
        let isActive: boolean | null = null;
        if (typeof status === "string") {
          isActive = status === "active" ? true : status === "inactive" ? false : null;
        } else if (Array.isArray(status) && status.length === 1) {
          isActive = status[0] === "active" ? true : status[0] === "inactive" ? false : null;
        }

        const sortByValue = searchFilters.sortBy;
        const sortDirValue = searchFilters.sortDir;
        const sortBy =
          typeof sortByValue === "string"
            ? sortByValue
            : Array.isArray(sortByValue) && sortByValue.length > 0
              ? sortByValue[0]
              : "name";
        const sortDir =
          typeof sortDirValue === "string"
            ? sortDirValue
            : Array.isArray(sortDirValue) && sortDirValue.length > 0
              ? sortDirValue[0]
              : "asc";

        // Call backend with pagination and filters
        const response = await apiClient.itemTypes.search({
          page,
          size: pageSize,
          name,
          isActive,
          sortBy,
          sortDir,
        });

        setItemTypes(response.content || []);
        setCurrentPage(response.pageNumber !== undefined ? response.pageNumber : page);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: "Failed to load item types",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [pageSize, toast]
  );

  const handleSearch = (searchFilters: Record<string, FilterValue>) => {
    setFilters(searchFilters);
    setCurrentPage(0);
    fetchItemTypes(0, searchFilters);
  };


  const handleOpenDialog = (item?: ItemType) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, description: item.description || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "" });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Item type name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        // Update existing
        await apiClient.itemTypes.update(editingId, formData);
        toast({
          title: "Success",
          description: "Item type updated successfully",
        });
      } else {
        // Create new
        await apiClient.itemTypes.create(formData);
        toast({
          title: "Success",
          description: "Item type created successfully",
        });
      }

      handleCloseDialog();
      // Refresh current page with current filters
      await fetchItemTypes(currentPage, filters);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to save item type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.itemTypes.toggleActive(id);
      toast({
        title: "Success",
        description: "Item type status updated",
      });
      // Refresh current page with current filters
      await fetchItemTypes(currentPage, filters);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to update item type status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item type?")) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.itemTypes.delete(id);
      toast({
        title: "Success",
        description: "Item type deleted successfully",
      });
      // Refresh current page with current filters
      await fetchItemTypes(currentPage, filters);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete item type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchItemTypes(newPage, filters);
  };

  return (
    <div className="space-y-6">
      {loading && <LoadingOverlay isLoading={loading} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Item Types Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} disabled={loading}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-slate-600 text-white">
                {Object.keys(filters).filter(k => filters[k] !== undefined && filters[k] !== null && filters[k] !== "").length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => handleOpenDialog()} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item Type
          </Button>
        </div>
      </div>

      {showFilters && (
        <AdvancedSearchPanel
          title="Search & Filter"
          subtitle="Filter item types by name, status, and sort options"
          inputFields={[
            {
              name: "name",
              label: "Item Type Name",
              placeholder: "Search by name...",
            },
          ]}
          checkboxGroups={[
            {
              name: "status",
              label: "Status",
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
          onSearch={handleSearch}
          isLoading={loading}
          backgroundColor="bg-gray-100"
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemTypes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(item.id)}
                      title={item.isActive ? "Deactivate" : "Activate"}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {item.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(item)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {itemTypes.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No item types found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {itemTypes.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} items
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Rows per page:</Label>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {totalElements > 0 ? currentPage + 1 : 0} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Item Type" : "Add New Item Type"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the item type details"
                : "Create a new item type for pawn transactions"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold Ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this item type"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

