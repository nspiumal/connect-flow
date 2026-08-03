import { useState, useEffect, useCallback } from "react";
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
import Textarea from "@/vendor/facit/components/bootstrap/forms/Textarea";
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { FilterPanel, FilterValue } from "@/components/facit/FilterPanel";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { t } from "@/lib/lang";

interface ItemType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ItemTypes() {
  const [loading, setLoading] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState<Record<string, FilterValue>>({});

  const fetchItemTypes = useCallback(
    async (page: number, searchFilters: Record<string, FilterValue>) => {
      try {
        setLoading(true);

        const name = typeof searchFilters.name === "string" ? searchFilters.name : undefined;

        const status = searchFilters.status;
        let isActive: boolean | null = null;
        if (typeof status === "string") {
          isActive = status === "active" ? true : status === "inactive" ? false : null;
        } else if (Array.isArray(status) && status.length === 1) {
          isActive = status[0] === "active" ? true : status[0] === "inactive" ? false : null;
        }

        const response = await apiClient.itemTypes.search({
          page,
          size: pageSize,
          name,
          isActive,
          sortBy: "name",
          sortDir: "asc",
        });

        setItemTypes(response.content || []);
        setCurrentPage(response.pageNumber !== undefined ? response.pageNumber : page);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } catch (error) {
        notify({ title: t("ERROR"), description: t("FAILED_TO_LOAD_ITEM_TYPES"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchItemTypes(0, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      notify({ title: t("VALIDATION_ERROR"), description: t("ITEM_TYPE_NAME_IS_REQUIRED"), variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await apiClient.itemTypes.update(editingId, formData);
        notify({ title: t("SUCCESS"), description: t("ITEM_TYPE_UPDATED_SUCCESSFULLY"), variant: "success" });
      } else {
        await apiClient.itemTypes.create(formData);
        notify({ title: t("SUCCESS"), description: t("ITEM_TYPE_CREATED_SUCCESSFULLY"), variant: "success" });
      }

      handleCloseDialog();
      await fetchItemTypes(currentPage, filters);
    } catch (error) {
      notify({ title: t("ERROR"), description: "Failed to save item type", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.itemTypes.toggleActive(id);
      notify({ title: t("SUCCESS"), description: t("ITEM_TYPE_STATUS_UPDATED"), variant: "success" });
      await fetchItemTypes(currentPage, filters);
    } catch (error) {
      notify({ title: t("ERROR"), description: "Failed to update item type status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ARE_YOU_SURE_DELETE_ITEM_TYPE"))) return;

    try {
      setLoading(true);
      await apiClient.itemTypes.delete(id);
      notify({ title: t("SUCCESS"), description: t("ITEM_TYPE_DELETED_SUCCESSFULLY"), variant: "success" });
      await fetchItemTypes(currentPage, filters);
    } catch (error) {
      notify({ title: t("ERROR"), description: "Failed to delete item type", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchItemTypes(newPage, filters);
  };

  const columns: DataTableColumn<ItemType>[] = [
    { key: "name", header: t("NAME") },
    { key: "description", header: t("DESCRIPTION"), className: "text-truncate", render: (i) => i.description || "—" },
    {
      key: "isActive",
      header: t("STATUS"),
      align: "center",
      render: (i) => <Badge color={i.isActive ? "success" : "secondary"} isLight>{i.isActive ? t("ACTIVE") : t("INACTIVE")}</Badge>,
    },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (item) => (
        <>
          <Button
            color="info"
            isLight
            icon={item.isActive ? "Visibility" : "VisibilityOff"}
            className="me-1"
            title={item.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(item.id)}
            aria-label="Toggle status"
          />
          <Button color="info" isLight icon="Edit" className="me-1" onClick={() => handleOpenDialog(item)} aria-label="Edit" />
          <Button color="danger" isLight icon="Delete" onClick={() => handleDelete(item.id)} aria-label="Delete" />
        </>
      ),
    },
  ];

  return (
    <PageWrapper title={t("ITEM_TYPES_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("ITEM_TYPES_MANAGEMENT"), to: "/item-types" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="primary" icon="Add" onClick={() => handleOpenDialog()} isDisable={loading}>
            {t("ADD_ITEM_TYPE")}
          </Button>
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="mb-4">
          <FilterPanel
            title={t("SEARCH_AND_FILTER")}
            subtitle={t("FILTER_ITEM_TYPES")}
            inputFields={[{ name: "name", label: t("ITEM_TYPE_NAME"), placeholder: t("SEARCH_BY_NAME"), inline: true }]}
            checkboxGroups={[
              {
                name: "status",
                label: t("STATUS"),
                options: [
                  { label: t("ACTIVE"), value: "active" },
                  { label: t("INACTIVE"), value: "inactive" },
                ],
                inline: true,
              },
            ]}
            onSearch={handleSearch}
            isLoading={loading}
          />
        </div>

        <Card>
          <CardBody className="p-0">
            <DataTable columns={columns} data={itemTypes} keyField={(i) => i.id} isLoading={loading} emptyMessage={t("NO_ITEM_TYPES_FOUND")} />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={handlePageChange}
            setPageSize={(size) => { setPageSize(size); setCurrentPage(0); }}
            label="item types"
          />
        </Card>
      </Page>

      <FormModal
        isOpen={showDialog}
        setIsOpen={(open) => (open ? setShowDialog(true) : handleCloseDialog())}
        title={editingId ? t("EDIT_ITEM_TYPE") : t("ADD_NEW_ITEM_TYPE")}
        onSubmit={handleSubmit}
        isSubmitting={loading}
        submitLabel={editingId ? t("UPDATE") : t("CREATE")}
      >
        <FormGroup id="itemTypeName" label={t("NAME_REQUIRED")} isFloating>
          <Input
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("E_G_GOLD_RING")}
          />
        </FormGroup>
        <FormGroup id="itemTypeDescription" label={t("DESCRIPTION")} isFloating>
          <Textarea
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t("DESCRIBE_THIS_ITEM_TYPE")}
            rows={3}
          />
        </FormGroup>
      </FormModal>
    </PageWrapper>
  );
}
