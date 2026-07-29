import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/integrations/api";
import { Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { CreateRoleDialog } from "@/components/roles/CreateRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { cn } from "@/lib/utils";

interface RoleData {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
}

interface PermissionData {
  id: string;
  key: string;
  module: string;
  label: string;
}

export default function Roles() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [grouped, setGrouped] = useState<Record<string, PermissionData[]>>({});
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [grantedKeys, setGrantedKeys] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [roleForEdit, setRoleForEdit] = useState<RoleData | null>(null);

  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      const data = await apiClient.roles.getAll();
      setRoles(data);
      return data as RoleData[];
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load roles", variant: "destructive" });
      return [];
    }
  };

  const fetchPermissionCatalog = async () => {
    try {
      const data = await apiClient.permissions.getGrouped();
      setGrouped(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load permissions", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetchRoles();
      await fetchPermissionCatalog();
      if (data.length > 0) setSelectedRole(data[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    setLoadingPermissions(true);
    apiClient.roles
      .getPermissions(selectedRole.name)
      .then((keys) => {
        setGrantedKeys(new Set(keys));
        setDirty(false);
      })
      .catch((error: any) => {
        toast({ title: "Error", description: error.message || "Failed to load role permissions", variant: "destructive" });
      })
      .finally(() => setLoadingPermissions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast({ title: "Success", description: `Permissions updated for ${selectedRole.label}` });
      setDirty(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save permissions", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleData) => {
    if (!window.confirm(`Delete role "${role.label}"? This cannot be undone.`)) return;
    try {
      await apiClient.roles.delete(role.id);
      toast({ title: "Success", description: "Role deleted" });
      const data = await fetchRoles();
      if (selectedRole?.id === role.id) setSelectedRole(data[0] || null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete role", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Roles &amp; Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Create roles and control exactly which functions each one can perform.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Role list */}
        <Card>
          <CardContent className="p-2">
            <div className="space-y-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2",
                    selectedRole?.id === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{r.label}</span>
                    <span className={cn("text-xs", selectedRole?.id === r.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {r.name}
                    </span>
                  </span>
                  {r.isSystem && <Badge variant="outline" className="shrink-0">System</Badge>}
                </button>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-6 text-center">No roles yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permission matrix */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Select a role to manage its permissions.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedRole.label}</h2>
                    {selectedRole.description && (
                      <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setRoleForEdit(selectedRole); setShowEdit(true); }}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button size="sm" variant="outline" onClick={() => handleDelete(selectedRole)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                      </Button>
                    )}
                    <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                      {saving ? "Saving..." : "Save Permissions"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {loadingPermissions ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading permissions...</p>
                ) : (
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                    {modules.map((moduleName) => {
                      const perms = grouped[moduleName];
                      const moduleKeys = perms.map((p) => p.key);
                      const allChecked = moduleKeys.every((k) => grantedKeys.has(k));
                      const someChecked = moduleKeys.some((k) => grantedKeys.has(k));
                      return (
                        <div key={moduleName}>
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={allChecked ? true : someChecked ? "indeterminate" : false}
                              onCheckedChange={(v) => toggleModule(moduleKeys, !!v)}
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {moduleName}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                            {perms.map((p) => (
                              <div key={p.key} className="flex items-center gap-2">
                                <Checkbox
                                  id={p.key}
                                  checked={grantedKeys.has(p.key)}
                                  onCheckedChange={(v) => togglePermission(p.key, !!v)}
                                />
                                <label htmlFor={p.key} className="text-sm cursor-pointer">
                                  {p.label}
                                </label>
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
          </CardContent>
        </Card>
      </div>

      <CreateRoleDialog open={showCreate} onOpenChange={setShowCreate} onSuccess={fetchRoles} />
      <EditRoleDialog
        role={roleForEdit}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={async () => {
          const data = await fetchRoles();
          if (selectedRole) {
            const refreshed = data.find((r: RoleData) => r.id === selectedRole.id);
            if (refreshed) setSelectedRole(refreshed);
          }
        }}
      />
    </div>
  );
}