import { useEffect, useMemo, useRef, useState } from "react";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft, SubHeaderRight } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import Button from "@/vendor/facit/components/bootstrap/Button";
import Spinner from "@/vendor/facit/components/bootstrap/Spinner";
import Checks from "@/vendor/facit/components/bootstrap/forms/Checks";
import classNames from "classnames";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { CreateRoleDialog } from "@/components/roles/CreateRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { useRoles } from "@/hooks/useLookups";
import { useAppDispatch } from "@/store/hooks";
import { rolesLookup } from "@/store/lookupSlices";
import type { Role as RoleData } from "@/store/lookupSlices";

interface PermissionData {
  id: string;
  key: string;
  module: string;
  label: string;
}

function ModuleCheckbox({ allChecked, someChecked, onChange }: { allChecked: boolean; someChecked: boolean; onChange: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !allChecked && someChecked;
  }, [allChecked, someChecked]);
  return (
    <Checks
      ref={ref}
      checked={allChecked}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
    />
  );
}

export default function Roles() {
  const dispatch = useAppDispatch();
  const roles = useRoles();
  const [grouped, setGrouped] = useState<Record<string, PermissionData[]>>({});
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [grantedKeys, setGrantedKeys] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [roleForEdit, setRoleForEdit] = useState<RoleData | null>(null);

  const fetchPermissionCatalog = async () => {
    try {
      const data = await apiClient.permissions.getGrouped();
      setGrouped(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load permissions";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPermissionCatalog();
  }, []);

  // Select the first role once the roles list has loaded (only while nothing is selected yet).
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  useEffect(() => {
    if (!selectedRole) return;
    setLoadingPermissions(true);
    apiClient.roles
      .getPermissions(selectedRole.name)
      .then((keys: string[]) => {
        setGrantedKeys(new Set(keys));
        setDirty(false);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to load role permissions";
        notify({ title: "Error", description: message, variant: "destructive" });
      })
      .finally(() => setLoadingPermissions(false));
  }, [selectedRole]);

  const modules = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const togglePermission = (key: string, checked: boolean) => {
    setGrantedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
    setDirty(true);
  };

  const toggleModule = (moduleKeys: string[], checked: boolean) => {
    setGrantedKeys((prev) => {
      const next = new Set(prev);
      moduleKeys.forEach((k) => (checked ? next.add(k) : next.delete(k)));
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await apiClient.roles.setPermissions(selectedRole.name, Array.from(grantedKeys));
      notify({ title: "Success", description: `Permissions updated for ${selectedRole.label}`, variant: "success" });
      setDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save permissions";
      notify({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleData) => {
    if (!window.confirm(`Delete role "${role.label}"? This cannot be undone.`)) return;
    try {
      await apiClient.roles.delete(role.id);
      notify({ title: "Success", description: "Role deleted", variant: "success" });
      dispatch(rolesLookup.invalidate());
      const data = await dispatch(rolesLookup.thunk()).unwrap();
      if (selectedRole?.id === role.id) setSelectedRole(data[0] || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete role";
      notify({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <PageWrapper title="Roles & Permissions">
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb list={[{ title: "Roles & Permissions", to: "/roles" }]} />
        </SubHeaderLeft>
        <SubHeaderRight>
          <Button color="primary" icon="VpnKey" onClick={() => setShowCreate(true)}>
            New Role
          </Button>
        </SubHeaderRight>
      </SubHeader>
      <Page>
        <div className="row g-4">
          <div className="col-12 col-lg-3">
            <Card>
              <CardBody className="p-2">
                <div className="d-flex flex-column gap-1">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={classNames("btn text-start d-flex align-items-center justify-content-between gap-2 py-2", {
                        "btn-primary": selectedRole?.id === r.id,
                        "btn-link text-decoration-none text-body": selectedRole?.id !== r.id,
                      })}
                    >
                      <span className="d-flex flex-column">
                        <span className="fw-semibold">{r.label}</span>
                        <span className={classNames("small", selectedRole?.id === r.id ? "text-white-50" : "text-muted")}>{r.name}</span>
                      </span>
                      {r.isSystem && <Badge color="secondary" isLight className="flex-shrink-0">System</Badge>}
                    </button>
                  ))}
                  {roles.length === 0 && <p className="text-muted small text-center py-4 mb-0">No roles yet.</p>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-9">
            <Card>
              <CardBody>
                {!selectedRole ? (
                  <p className="text-muted text-center py-5 mb-0">Select a role to manage its permissions.</p>
                ) : (
                  <>
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <h2 className="fs-5 fw-semibold mb-0">{selectedRole.label}</h2>
                        {selectedRole.description && <p className="text-muted small mb-0">{selectedRole.description}</p>}
                      </div>
                      <div className="d-flex gap-2">
                        <Button color="dark" isLight icon="Edit" onClick={() => { setRoleForEdit(selectedRole); setShowEdit(true); }}>
                          Edit
                        </Button>
                        {!selectedRole.isSystem && (
                          <Button color="danger" isLight icon="Delete" onClick={() => handleDelete(selectedRole)}>
                            Delete
                          </Button>
                        )}
                        <Button color="primary" onClick={handleSave} isDisable={!dirty || saving}>
                          {saving && <Spinner isSmall inButton />}
                          {saving ? "Saving..." : "Save Permissions"}
                        </Button>
                      </div>
                    </div>

                    <hr />

                    {loadingPermissions ? (
                      <p className="text-muted text-center py-5 mb-0">Loading permissions...</p>
                    ) : (
                      <div className="d-flex flex-column gap-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        {modules.map((moduleName) => {
                          const perms = grouped[moduleName];
                          const moduleKeys = perms.map((p) => p.key);
                          const allChecked = moduleKeys.every((k) => grantedKeys.has(k));
                          const someChecked = moduleKeys.some((k) => grantedKeys.has(k));
                          return (
                            <div key={moduleName}>
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <ModuleCheckbox allChecked={allChecked} someChecked={someChecked} onChange={(checked) => toggleModule(moduleKeys, checked)} />
                                <span className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: "0.05em" }}>
                                  {moduleName}
                                </span>
                              </div>
                              <div className="row g-2 ps-4">
                                {perms.map((p) => (
                                  <div key={p.key} className="col-12 col-sm-6 col-lg-4">
                                    <Checks
                                      id={p.key}
                                      label={p.label}
                                      checked={grantedKeys.has(p.key)}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => togglePermission(p.key, e.target.checked)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>

      <CreateRoleDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {
          dispatch(rolesLookup.invalidate());
          dispatch(rolesLookup.thunk());
        }}
      />
      <EditRoleDialog
        role={roleForEdit}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={async () => {
          dispatch(rolesLookup.invalidate());
          const data = await dispatch(rolesLookup.thunk()).unwrap();
          if (selectedRole) {
            const refreshed = data.find((r) => r.id === selectedRole.id);
            if (refreshed) setSelectedRole(refreshed);
          }
        }}
      />
    </PageWrapper>
  );
}
