-- ============================================================================
-- Kalyani House of Jewellers - Roles & Permissions
-- ============================================================================
-- Adds a real RBAC layer on top of the existing `user_roles.role` column.
--
-- Design: `role_permissions.role_name` references `roles(name)` directly —
-- there is no `role_id` FK anywhere. `user_roles.role` (already VARCHAR-ish
-- via the Sequelize ENUM) keeps being the single identifier the rest of the
-- system uses (JWT/login response, UserDTO, AuthContext). Permission checks
-- are a single join: user_roles.role -> role_permissions.role_name.
--
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- Run manually: psql "$DB_URL" -f backend/migrations/001_roles_permissions.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Step 1: relax the user_roles.role ENUM to a plain VARCHAR ────────────────
-- Custom role names (e.g. "Auditor") cannot be inserted while role is an ENUM.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'user_roles' AND a.attname = 'role' AND t.typtype = 'e'
  ) THEN
    ALTER TABLE user_roles ALTER COLUMN role TYPE VARCHAR(50) USING role::text;
  END IF;
END $$;

DROP TYPE IF EXISTS enum_user_roles_role;

-- ── Step 2: roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Step 3: permissions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    label VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Step 4: role_permissions (role identified by NAME, not an id) ────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL REFERENCES roles(name) ON UPDATE CASCADE ON DELETE CASCADE,
    permission_id CHAR(36) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_name, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- ── Step 5: seed the four existing system roles ──────────────────────────────
INSERT INTO roles (id, name, label, description, is_system, is_active)
VALUES
  (gen_random_uuid(), 'SUPERADMIN', 'Super Admin', 'Full system access, manages roles and permissions.', TRUE, TRUE),
  (gen_random_uuid(), 'ADMIN', 'Admin', 'Branch and operations administration.', TRUE, TRUE),
  (gen_random_uuid(), 'MANAGER', 'Branch Manager', 'Manages a single branch''s day-to-day pawn operations.', TRUE, TRUE),
  (gen_random_uuid(), 'STAFF', 'Staff', 'Front-desk pawn ticket and customer handling.', TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Sanity check: every role name already referenced by user_roles must exist above.
DO $$
DECLARE missing_count INT;
BEGIN
  SELECT count(DISTINCT role) INTO missing_count
  FROM user_roles
  WHERE role NOT IN (SELECT name FROM roles);
  IF missing_count > 0 THEN
    RAISE WARNING '% distinct role name(s) in user_roles have no matching roles row', missing_count;
  END IF;
END $$;

-- ── Step 6: seed permissions (one row per function in docs/project-function-permissions.md) ──
INSERT INTO permissions (id, key, module, label) VALUES
  (gen_random_uuid(), 'auth.logout', 'auth', 'Sign out'),

  (gen_random_uuid(), 'dashboard.view', 'dashboard', 'Open dashboard'),
  (gen_random_uuid(), 'dashboard.view.superadmin', 'dashboard', 'Super-admin dashboard'),
  (gen_random_uuid(), 'dashboard.view.admin', 'dashboard', 'Admin dashboard'),
  (gen_random_uuid(), 'dashboard.view.manager', 'dashboard', 'Manager dashboard'),
  (gen_random_uuid(), 'dashboard.view.staff', 'dashboard', 'Staff dashboard'),

  (gen_random_uuid(), 'users.view', 'users', 'View user list'),
  (gen_random_uuid(), 'users.search', 'users', 'Filter users'),
  (gen_random_uuid(), 'users.create', 'users', 'Create user'),
  (gen_random_uuid(), 'users.edit', 'users', 'Edit user'),
  (gen_random_uuid(), 'users.pin.status', 'users', 'Check PIN status'),
  (gen_random_uuid(), 'users.pin.set', 'users', 'Set PIN'),
  (gen_random_uuid(), 'users.pin.change', 'users', 'Change PIN'),
  (gen_random_uuid(), 'users.pin.verify', 'users', 'Verify PIN'),
  (gen_random_uuid(), 'users.lookup.byEmail', 'users', 'Look up user by email'),
  (gen_random_uuid(), 'users.lookup.byRole', 'users', 'List users by role'),
  (gen_random_uuid(), 'users.lookup.byBranch', 'users', 'List users by branch'),
  (gen_random_uuid(), 'users.list.all', 'users', 'Unbounded user list'),
  (gen_random_uuid(), 'users.stats.admin', 'users', 'Admin dashboard user stats'),

  (gen_random_uuid(), 'branches.view', 'branches', 'View branch list'),
  (gen_random_uuid(), 'branches.list.active', 'branches', 'List active branches'),
  (gen_random_uuid(), 'branches.create', 'branches', 'Create branch'),
  (gen_random_uuid(), 'branches.edit', 'branches', 'Edit branch'),
  (gen_random_uuid(), 'branches.toggleActive', 'branches', 'Activate/deactivate branch'),
  (gen_random_uuid(), 'branches.delete', 'branches', 'Delete branch'),
  (gen_random_uuid(), 'branches.list.all', 'branches', 'Unbounded branch list'),
  (gen_random_uuid(), 'branches.getById', 'branches', 'Fetch one branch'),

  (gen_random_uuid(), 'branchRequests.view', 'branchRequests', 'View branch requests'),
  (gen_random_uuid(), 'branchRequests.approve', 'branchRequests', 'Approve branch request'),
  (gen_random_uuid(), 'branchRequests.reject', 'branchRequests', 'Reject branch request'),

  (gen_random_uuid(), 'itemTypes.view', 'itemTypes', 'View item types'),
  (gen_random_uuid(), 'itemTypes.list.active', 'itemTypes', 'List active item types'),
  (gen_random_uuid(), 'itemTypes.create', 'itemTypes', 'Create item type'),
  (gen_random_uuid(), 'itemTypes.edit', 'itemTypes', 'Edit item type'),
  (gen_random_uuid(), 'itemTypes.toggleActive', 'itemTypes', 'Activate/deactivate item type'),
  (gen_random_uuid(), 'itemTypes.delete', 'itemTypes', 'Delete item type'),
  (gen_random_uuid(), 'itemTypes.getById', 'itemTypes', 'Fetch one item type'),

  (gen_random_uuid(), 'interestRates.view', 'interestRates', 'View interest rates'),
  (gen_random_uuid(), 'interestRates.list.active', 'interestRates', 'List active interest rates'),
  (gen_random_uuid(), 'interestRates.getDefault', 'interestRates', 'Get default rate'),
  (gen_random_uuid(), 'interestRates.create', 'interestRates', 'Create interest rate'),
  (gen_random_uuid(), 'interestRates.edit', 'interestRates', 'Edit interest rate'),
  (gen_random_uuid(), 'interestRates.toggleActive', 'interestRates', 'Activate/deactivate rate'),
  (gen_random_uuid(), 'interestRates.setDefault', 'interestRates', 'Set default rate'),
  (gen_random_uuid(), 'interestRates.delete', 'interestRates', 'Delete interest rate'),

  (gen_random_uuid(), 'customers.view', 'customers', 'View customers'),
  (gen_random_uuid(), 'customers.search', 'customers', 'Quick search customers'),
  (gen_random_uuid(), 'customers.search.advanced', 'customers', 'Advanced customer search'),
  (gen_random_uuid(), 'customers.getByNic', 'customers', 'Get customer by NIC'),
  (gen_random_uuid(), 'customers.checkNic', 'customers', 'Check NIC exists'),
  (gen_random_uuid(), 'customers.getById', 'customers', 'Fetch one customer'),
  (gen_random_uuid(), 'customers.getByType', 'customers', 'List customers by type'),
  (gen_random_uuid(), 'customers.list.all', 'customers', 'Unbounded customer list'),
  (gen_random_uuid(), 'customers.create', 'customers', 'Create customer'),
  (gen_random_uuid(), 'customers.edit', 'customers', 'Edit customer'),
  (gen_random_uuid(), 'customers.delete', 'customers', 'Delete customer'),

  (gen_random_uuid(), 'blacklist.view', 'blacklist', 'View blacklist'),
  (gen_random_uuid(), 'blacklist.search', 'blacklist', 'Search/filter blacklist'),
  (gen_random_uuid(), 'blacklist.create', 'blacklist', 'Add blacklist entry'),
  (gen_random_uuid(), 'blacklist.edit', 'blacklist', 'Edit blacklist entry'),
  (gen_random_uuid(), 'blacklist.toggleActive', 'blacklist', 'Activate/deactivate entry'),
  (gen_random_uuid(), 'blacklist.delete', 'blacklist', 'Delete blacklist entry'),
  (gen_random_uuid(), 'blacklist.verifyNic', 'blacklist', 'Verify NIC during pawning'),
  (gen_random_uuid(), 'blacklist.checkNic', 'blacklist', 'Check NIC (server-side)'),
  (gen_random_uuid(), 'blacklist.list.active', 'blacklist', 'List active entries'),
  (gen_random_uuid(), 'blacklist.getByBranch', 'blacklist', 'Entries for a branch'),
  (gen_random_uuid(), 'blacklist.getById', 'blacklist', 'Fetch one entry'),

  (gen_random_uuid(), 'tickets.create', 'tickets', 'Create pawn ticket'),
  (gen_random_uuid(), 'tickets.create.alt', 'tickets', 'Create pawn ticket (legacy flow)'),
  (gen_random_uuid(), 'tickets.create.inline', 'tickets', 'Create ticket from list screen'),
  (gen_random_uuid(), 'tickets.create.managerPin', 'tickets', 'Manager PIN authorisation on create'),
  (gen_random_uuid(), 'tickets.patternConfig', 'tickets', 'Read special-pattern config'),
  (gen_random_uuid(), 'tickets.images.upload', 'tickets', 'Attach item images'),
  (gen_random_uuid(), 'tickets.view', 'tickets', 'View ticket list'),
  (gen_random_uuid(), 'tickets.search.advanced', 'tickets', 'Advanced ticket search'),
  (gen_random_uuid(), 'tickets.search.basic', 'tickets', 'Keyword ticket search'),
  (gen_random_uuid(), 'tickets.view.detail', 'tickets', 'View ticket detail'),
  (gen_random_uuid(), 'tickets.view.history', 'tickets', 'View edit history'),
  (gen_random_uuid(), 'tickets.getByPawnId', 'tickets', 'Look up by pawn ID'),
  (gen_random_uuid(), 'tickets.getByBranch', 'tickets', 'Tickets of a branch'),
  (gen_random_uuid(), 'tickets.list.all', 'tickets', 'Unbounded ticket list'),
  (gen_random_uuid(), 'tickets.balance.view', 'tickets', 'View outstanding balance'),
  (gen_random_uuid(), 'tickets.edit', 'tickets', 'Edit ticket details'),
  (gen_random_uuid(), 'tickets.edit.remarks', 'tickets', 'Edit ticket remarks'),
  (gen_random_uuid(), 'tickets.edit.managerPin', 'tickets', 'Manager PIN authorisation on edit'),
  (gen_random_uuid(), 'tickets.status.change', 'tickets', 'Change ticket status'),
  (gen_random_uuid(), 'tickets.specialRate', 'tickets', 'Apply special interest rate'),
  (gen_random_uuid(), 'tickets.blockReason', 'tickets', 'Set block reason'),
  (gen_random_uuid(), 'tickets.update', 'tickets', 'Whole-ticket update'),
  (gen_random_uuid(), 'tickets.delete', 'tickets', 'Delete ticket'),

  (gen_random_uuid(), 'redemption.view.balance', 'redemption', 'View payoff quote'),
  (gen_random_uuid(), 'redemption.process', 'redemption', 'Process redemption payment'),
  (gen_random_uuid(), 'redemption.history', 'redemption', 'View redemption history'),

  (gen_random_uuid(), 'profit.record', 'profit', 'Record profit on ticket'),
  (gen_random_uuid(), 'profit.view.byTicket', 'profit', 'View profit for a ticket'),
  (gen_random_uuid(), 'profit.view.list', 'profit', 'View profited items list'),
  (gen_random_uuid(), 'profit.search', 'profit', 'Search profited items'),
  (gen_random_uuid(), 'profit.create', 'profit', 'Record profit (standalone)'),
  (gen_random_uuid(), 'profit.list.all', 'profit', 'Unbounded profit list'),

  (gen_random_uuid(), 'reports.view', 'reports', 'View reports'),
  (gen_random_uuid(), 'reports.filter.branch', 'reports', 'Report across all branches'),
  (gen_random_uuid(), 'reports.profit', 'reports', 'Profit report section'),

  (gen_random_uuid(), 'activityLogs.view', 'activityLogs', 'Browse activity log'),
  (gen_random_uuid(), 'activityLogs.search', 'activityLogs', 'Filter activity log'),

  (gen_random_uuid(), 'auditLogs.view', 'auditLogs', 'View audit log'),

  (gen_random_uuid(), 'roles.view', 'roles', 'View roles & permissions'),
  (gen_random_uuid(), 'roles.manage', 'roles', 'Create roles and edit permissions')
ON CONFLICT (key) DO NOTHING;

-- ── Step 7: seed role_permissions to reproduce today's gates ─────────────────

-- SUPERADMIN: every permission.
INSERT INTO role_permissions (id, role_name, permission_id)
SELECT gen_random_uuid(), 'SUPERADMIN', p.id FROM permissions p
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- ADMIN: everything except role management and the audit log.
INSERT INTO role_permissions (id, role_name, permission_id)
SELECT gen_random_uuid(), 'ADMIN', p.id FROM permissions p
WHERE p.key NOT IN ('roles.view', 'roles.manage', 'auditLogs.view')
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- MANAGER
INSERT INTO role_permissions (id, role_name, permission_id)
SELECT gen_random_uuid(), 'MANAGER', p.id FROM permissions p
WHERE p.key = ANY(ARRAY[
  'dashboard.view', 'dashboard.view.manager',
  'reports.view', 'reports.profit',
  'users.view', 'users.search', 'users.lookup.byBranch', 'users.pin.verify',
  'branches.list.active',
  'itemTypes.list.active',
  'interestRates.list.active', 'interestRates.getDefault',
  'customers.view', 'customers.search', 'customers.search.advanced', 'customers.getByNic', 'customers.checkNic',
  'blacklist.view', 'blacklist.search', 'blacklist.create', 'blacklist.edit', 'blacklist.toggleActive',
  'blacklist.verifyNic', 'blacklist.checkNic',
  'tickets.create', 'tickets.create.inline', 'tickets.create.managerPin', 'tickets.patternConfig', 'tickets.images.upload',
  'tickets.view', 'tickets.search.advanced', 'tickets.search.basic', 'tickets.view.detail', 'tickets.view.history', 'tickets.balance.view',
  'tickets.edit', 'tickets.edit.remarks', 'tickets.edit.managerPin', 'tickets.status.change', 'tickets.specialRate', 'tickets.blockReason',
  'redemption.view.balance', 'redemption.process', 'redemption.history',
  'profit.record', 'profit.view.byTicket', 'profit.view.list', 'profit.search', 'profit.create', 'profit.list.all'
])
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- STAFF
INSERT INTO role_permissions (id, role_name, permission_id)
SELECT gen_random_uuid(), 'STAFF', p.id FROM permissions p
WHERE p.key = ANY(ARRAY[
  'dashboard.view', 'dashboard.view.staff',
  'branches.list.active',
  'itemTypes.list.active',
  'interestRates.list.active', 'interestRates.getDefault',
  'customers.view', 'customers.search', 'customers.search.advanced', 'customers.getByNic', 'customers.checkNic',
  'blacklist.view', 'blacklist.search', 'blacklist.create', 'blacklist.edit', 'blacklist.toggleActive',
  'blacklist.verifyNic', 'blacklist.checkNic',
  'tickets.create', 'tickets.create.inline', 'tickets.create.managerPin', 'tickets.patternConfig', 'tickets.images.upload',
  'tickets.view', 'tickets.search.advanced', 'tickets.search.basic', 'tickets.view.detail', 'tickets.view.history', 'tickets.balance.view',
  'tickets.edit', 'tickets.edit.remarks', 'tickets.status.change',
  'users.pin.verify'
])
ON CONFLICT (role_name, permission_id) DO NOTHING;