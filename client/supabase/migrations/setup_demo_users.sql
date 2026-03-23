-- ============================================================================
-- Connect Flow - Demo Users Setup Script
-- ============================================================================
-- This script creates demo user profiles and roles for testing
--
-- IMPORTANT: Users must FIRST be created in Supabase Auth Dashboard
-- This script only creates the profile and role records in the database
--
-- Steps:
-- 1. Create users in Supabase Dashboard > Authentication > Users
-- 2. Run this SQL script in Supabase SQL Editor
-- 3. Login with the demo credentials below
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Demo Profiles
-- ============================================================================
-- Insert profile for SUPERADMIN
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT id, 'Super Administrator', email, '+1-555-0100'
FROM auth.users
WHERE email = 'superadmin@connectflow.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Super Administrator',
  phone = '+1-555-0100',
  updated_at = now();

-- Insert profile for ADMIN
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT id, 'System Administrator', email, '+1-555-0101'
FROM auth.users
WHERE email = 'admin@connectflow.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'System Administrator',
  phone = '+1-555-0101',
  updated_at = now();

-- Insert profile for MANAGER
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT id, 'Branch Manager', email, '+1-555-0102'
FROM auth.users
WHERE email = 'manager@connectflow.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Branch Manager',
  phone = '+1-555-0102',
  updated_at = now();

-- Insert profile for STAFF
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT id, 'Staff Member', email, '+1-555-0103'
FROM auth.users
WHERE email = 'staff@connectflow.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Staff Member',
  phone = '+1-555-0103',
  updated_at = now();

-- ============================================================================
-- STEP 2: Create Demo Branches (Optional - for manager/staff assignment)
-- ============================================================================
-- Run this only if you don't have existing branches
/*
INSERT INTO public.branches (name, address, phone, is_active)
VALUES
  ('Main Branch', '123 Main Street, Downtown', '+1-555-1000', true),
  ('East Branch', '456 East Avenue, Uptown', '+1-555-1001', true),
  ('West Branch', '789 West Road, Suburb', '+1-555-1002', true)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- STEP 3: Create Demo User Roles
-- ============================================================================

-- Create SUPERADMIN role (no branch assignment needed)
INSERT INTO public.user_roles (user_id, role, branch_id)
SELECT id, 'SUPERADMIN'::app_role, NULL
FROM auth.users
WHERE email = 'superadmin@connectflow.com'
ON CONFLICT (user_id, role, branch_id) DO NOTHING;

-- Create ADMIN role (no branch assignment needed)
INSERT INTO public.user_roles (user_id, role, branch_id)
SELECT id, 'ADMIN'::app_role, NULL
FROM auth.users
WHERE email = 'admin@connectflow.com'
ON CONFLICT (user_id, role, branch_id) DO NOTHING;

-- Create MANAGER role (assign to first branch)
INSERT INTO public.user_roles (user_id, role, branch_id)
SELECT
  auth_users.id,
  'MANAGER'::app_role,
  branches.id
FROM auth.users auth_users
CROSS JOIN (
  SELECT id FROM public.branches LIMIT 1
) branches
WHERE auth_users.email = 'manager@connectflow.com'
ON CONFLICT (user_id, role, branch_id) DO NOTHING;

-- Create STAFF role (assign to first branch)
INSERT INTO public.user_roles (user_id, role, branch_id)
SELECT
  auth_users.id,
  'STAFF'::app_role,
  branches.id
FROM auth.users auth_users
CROSS JOIN (
  SELECT id FROM public.branches LIMIT 1
) branches
WHERE auth_users.email = 'staff@connectflow.com'
ON CONFLICT (user_id, role, branch_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Verify Setup (Run these queries to confirm)
-- ============================================================================
-- Check created profiles
SELECT 'PROFILES' as check_type, email, full_name, created_at
FROM public.profiles
WHERE email IN (
  'superadmin@connectflow.com',
  'admin@connectflow.com',
  'manager@connectflow.com',
  'staff@connectflow.com'
)
ORDER BY created_at;

-- Check created roles
SELECT
  'ROLES' as check_type,
  p.email,
  ur.role,
  b.name as branch_name,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users p ON ur.user_id = p.id
LEFT JOIN public.branches b ON ur.branch_id = b.id
WHERE p.email IN (
  'superadmin@connectflow.com',
  'admin@connectflow.com',
  'manager@connectflow.com',
  'staff@connectflow.com'
)
ORDER BY ur.created_at;

-- ============================================================================
-- DEMO USER CREDENTIALS
-- ============================================================================
/*
SUPERADMIN:
  Email:    superadmin@connectflow.com
  Password: SuperAdmin@123

ADMIN:
  Email:    admin@connectflow.com
  Password: Admin@123

MANAGER:
  Email:    manager@connectflow.com
  Password: Manager@123

STAFF:
  Email:    staff@connectflow.com
  Password: Staff@123

LOGIN URL: http://localhost:5173/login
*/

-- ============================================================================
-- CLEANUP SCRIPT (if you need to remove demo users)
-- ============================================================================
/*
-- Delete demo user roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'superadmin@connectflow.com',
    'admin@connectflow.com',
    'manager@connectflow.com',
    'staff@connectflow.com'
  )
);

-- Delete demo profiles
DELETE FROM public.profiles
WHERE email IN (
  'superadmin@connectflow.com',
  'admin@connectflow.com',
  'manager@connectflow.com',
  'staff@connectflow.com'
);

-- Delete demo users from auth (run in Supabase Dashboard)
-- Users > Select each user > Delete User
*/

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================

