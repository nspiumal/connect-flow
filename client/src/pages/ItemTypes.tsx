import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { CommonSearch, SearchField } from "@/components/CommonSearch";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Pagination and Filter State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search filters
  const [filters, setFilters] = useState<Record<string, string | null>>({});

  // Define search fields for CommonSearch component
  const searchFields: SearchField[] = [
    {
      name: "name",
      label: "Item Type Name",
      type: "text",
      placeholder: "Search by name...",
      optional: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      optional: true,
    },
    {
      name: "sortBy",
      label: "Sort By",
      type: "select",
      options: [
        { label: "Name", value: "name" },
        { label: "Created Date", value: "createdAt" },
        { label: "Updated Date", value: "updatedAt" },
      ],
      optional: true,
    },
    {
      name: "sortDir",
      label: "Order",
      type: "select",
      options: [
        { label: "Ascending", value: "asc" },
        { label: "Descending", value: "desc" },
      ],
      optional: true,
    },
  ];

  // Load item types on mount
  useEffect(() => {
    fetchItemTypes(0, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchItemTypes = useCallback(
    async (page: number, searchFilters: Record<string, string | null>) => {
      try {
        setLoading(true);

        // Parse filters
        const name = searchFilters.name || undefined;
        const status = searchFilters.status;
        const isActive = status === "active" ? true : status === "inactive" ? false : null;
        const sortBy = searchFilters.sortBy || "name";
        const sortDir = searchFilters.sortDir || "asc";

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
        setCurrentPage(response.number || 0);
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

  const handleSearch = (searchFilters: Record<string, string | null>) => {
    setFilters(searchFilters);
    setCurrentPage(0);
    fetchItemTypes(0, searchFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(0);
    fetchItemTypes(0, {});
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
    <>
      {loading && <LoadingOverlay isLoading={loading} />}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Item Types</h1>
          <p className="text-gray-500 mt-1">Manage gold item types for pawn transactions</p>
        </div>

        {/* CommonSearch Component - Advanced Filters */}
        <CommonSearch
          fields={searchFields}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          isLoading={loading}
          title="Search & Filter"
          showBorder={true}
          borderColor="border-blue-300"
          backgroundColor="bg-blue-50"
        />

        {/* Item Types List Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Item Types List</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Showing {itemTypes.length} of {totalElements} items
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item Type
            </Button>
          </CardHeader>

          <CardContent>
            {itemTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No item types found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemTypes.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {item.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 flex justify-end">
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
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
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
    </>
  );
}

