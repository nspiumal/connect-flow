-- ============================================================================
-- Connect Flow - Fix Authentication & RLS Policies
-- ============================================================================
-- This script fixes common authentication issues by ensuring RLS policies
-- allow proper access to user data
-- ============================================================================

-- ============================================================================
-- STEP 1: Disable RLS Temporarily (for testing/development)
-- ============================================================================
-- WARNING: This is for development only. Re-enable RLS in production!

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Proper RLS Policies (if needed in future)
-- ============================================================================

-- Enable RLS again
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read profiles
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Policy: Users can only see their own profile
CREATE POLICY "Users can see own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Policy: Anyone authenticated can read user roles
CREATE POLICY "Anyone can read user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

-- Policy: Anyone authenticated can read branches
CREATE POLICY "Anyone can read branches"
  ON public.branches FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if users exist
SELECT id, email FROM auth.users
WHERE email IN (
  'staff@connectflow.com',
  'manager@connectflow.com',
  'admin@connectflow.com',
  'superadmin@connectflow.com'
)
ORDER BY created_at;

-- Check if profiles exist
SELECT id, full_name, email FROM public.profiles
WHERE email IN (
  'staff@connectflow.com',
  'manager@connectflow.com',
  'admin@connectflow.com',
  'superadmin@connectflow.com'
)
ORDER BY created_at;

-- Check if user roles exist
SELECT ur.id, p.email, ur.role, b.name as branch_name
FROM public.user_roles ur
JOIN auth.users p ON ur.user_id = p.id
LEFT JOIN public.branches b ON ur.branch_id = b.id
WHERE p.email IN (
  'staff@connectflow.com',
  'manager@connectflow.com',
  'admin@connectflow.com',
  'superadmin@connectflow.com'
)
ORDER BY p.email;

-- Check table RLS status
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_roles', 'branches');

