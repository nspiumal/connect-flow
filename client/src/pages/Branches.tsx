import { useEffect, useState } from "react";
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
import { DataTable, DataTableColumn } from "@/components/facit/DataTable";
import { TablePagination } from "@/components/facit/TablePagination";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { usePermission } from "@/hooks/usePermission";
import { t } from "@/lib/lang";

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  manager_id?: string;
}

interface ManagerOption {
  id: string;
  full_name: string;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const has = usePermission();

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.branches.getPaginated(currentPage, pageSize, sortBy, sortDir);
      const normalized: Branch[] = response.content.map((b: Branch & { isActive?: boolean; managerId?: string }) => ({
        ...b,
        is_active: b.isActive ?? b.is_active,
        manager_id: b.managerId ?? b.manager_id,
      }));
      setBranches(normalized);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load branches";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const data: { id: string; fullName: string }[] = await apiClient.users.getByRole("MANAGER");
      setManagers(data.map((u) => ({ id: u.id, full_name: u.fullName })));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load managers";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, sortDir]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const manager = managerId === "none" || managerId === "" ? null : managerId;
      if (editing) {
        await apiClient.branches.update(editing.id, { name, address, phone, managerId: manager, isActive: editing.is_active });
        notify({ title: "Branch updated", variant: "success" });
      } else {
        await apiClient.branches.create({ name, address, phone, managerId: manager, isActive: true });
        notify({ title: "Branch created", variant: "success" });
      }
      setShowDialog(false);
      setEditing(null);
      setName(""); setAddress(""); setPhone(""); setManagerId("");
      fetchBranches();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save branch";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (branch: Branch) => {
    try {
      await apiClient.branches.update(branch.id, { isActive: !branch.is_active });
      fetchBranches();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update branch";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setName(branch.name);
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setManagerId(branch.manager_id || "");
    setShowDialog(true);
  };

  const openCreate = () => {
    setEditing(null);
    setName(""); setAddress(""); setPhone(""); setManagerId("");
    setShowDialog(true);
  };

  const columns: DataTableColumn<Branch>[] = [
    { key: "name", header: t("NAME"), sortable: true },
    { key: "address", header: t("ADDRESS") },
    { key: "phone", header: t("PHONE") },
    {
      key: "is_active",
      header: t("STATUS"),
      render: (b) => <Badge color={b.is_active ? "success" : "secondary"} isLight>{b.is_active ? t("ACTIVE") : t("INACTIVE")}</Badge>,
    },
    {
      key: "actions",
      header: t("ACTIONS"),
      align: "end",
      render: (b) => (
        <>
          <Button color="dark" isLight icon="Edit" className="me-1" onClick={() => openEdit(b)} aria-label="Edit" />
          <Button color="dark" isLight icon="Power" onClick={() => toggleActive(b)} aria-label="Toggle active" />
        </>
      ),
    },
  ];

  return (
    <PageWrapper title={t("BRANCH_MANAGEMENT")}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: t("BRANCH_MANAGEMENT"), to: "/branches" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          {has("branches.create") && (
            <Button color="primary" icon="Add" onClick={openCreate}>
              {t("ADD_BRANCH")}
            </Button>
          )}
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={branches}
              keyField={(b) => b.id}
              isLoading={isLoading}
              emptyMessage={t("NO_BRANCHES_FOUND")}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </CardBody>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            label="branches"
          />
        </Card>
      </Page>

      <FormModal
        isOpen={showDialog}
        setIsOpen={setShowDialog}
        title={editing ? t("EDIT_BRANCH") : t("CREATE_BRANCH")}
        onSubmit={handleSave}
        isSubmitting={saving}
        submitLabel={editing ? t("UPDATE") : t("CREATE")}
      >
        <FormGroup id="branchName" label={t("BRANCH_NAME")} isFloating>
          <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
        </FormGroup>
        <FormGroup id="branchAddress" label={t("ADDRESS")} isFloating>
          <Input value={address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)} />
        </FormGroup>
        <FormGroup id="branchPhone" label={t("PHONE")} isFloating>
          <Input value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
        </FormGroup>
        <FormGroup id="branchManager" label={t("ASSIGN_MANAGER")}>
          <Select ariaLabel={t("ASSIGN_MANAGER")} value={managerId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setManagerId(e.target.value)}>
            <Option value="none">{t("NONE")}</Option>
            {managers.map((m) => (
              <Option key={m.id} value={m.id}>{m.full_name}</Option>
            ))}
          </Select>
        </FormGroup>
      </FormModal>
    </PageWrapper>
  );
}
