
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER', 'STAFF');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Add FK from user_roles to branches
ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create pawn_transactions table
CREATE TABLE public.pawn_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pawn_id TEXT NOT NULL UNIQUE,
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  customer_name TEXT NOT NULL,
  customer_nic TEXT NOT NULL,
  customer_address TEXT,
  customer_phone TEXT,
  customer_type TEXT NOT NULL DEFAULT 'Regular',
  item_description TEXT NOT NULL,
  item_weight_grams NUMERIC(10,2) NOT NULL,
  item_karat INTEGER NOT NULL DEFAULT 24,
  appraised_value NUMERIC(12,2) NOT NULL,
  loan_amount NUMERIC(12,2) NOT NULL,
  interest_rate_id UUID,
  interest_rate_percent NUMERIC(5,2) NOT NULL,
  period_months INTEGER NOT NULL DEFAULT 6,
  pawn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pawn_transactions ENABLE ROW LEVEL SECURITY;

-- Create interest_rates table
CREATE TABLE public.interest_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate_percent NUMERIC(5,2) NOT NULL,
  period_months INTEGER NOT NULL,
  customer_type TEXT NOT NULL DEFAULT 'Regular',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interest_rates ENABLE ROW LEVEL SECURITY;

-- Create blacklist table
CREATE TABLE public.blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_nic TEXT NOT NULL,
  reason TEXT NOT NULL,
  police_report_number TEXT,
  police_report_date DATE,
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

-- Create branch_requests table
CREATE TABLE public.branch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name TEXT NOT NULL,
  branch_address TEXT,
  branch_phone TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branch_requests ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create dashboard_widgets table
CREATE TABLE public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  widget_config JSONB DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'SUPERADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'SUPERADMIN' THEN 1
      WHEN 'ADMIN' THEN 2
      WHEN 'MANAGER' THEN 3
      WHEN 'STAFF' THEN 4
    END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.user_roles
  WHERE user_id = auth.uid() AND branch_id IS NOT NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_branch_access(_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND branch_id = _branch_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Superadmin can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Same branch can view profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur1
    JOIN public.user_roles ur2 ON ur1.branch_id = ur2.branch_id
    WHERE ur1.user_id = auth.uid() AND ur2.user_id = profiles.id
  ));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Superadmin can update all profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Profiles can be created" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Superadmin can delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_superadmin());

-- USER_ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Superadmin can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Admin/Manager can view branch roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role, 'MANAGER'::app_role]));
CREATE POLICY "Superadmin can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role]));

-- BRANCHES policies
CREATE POLICY "Superadmin full access branches" ON public.branches FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Authenticated can view active branches" ON public.branches FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admin can manage branches" ON public.branches FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role]));

-- PAWN_TRANSACTIONS policies
CREATE POLICY "Superadmin full access transactions" ON public.pawn_transactions FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Branch members can view transactions" ON public.pawn_transactions FOR SELECT TO authenticated
  USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch staff can create transactions" ON public.pawn_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_branch_access(branch_id));
CREATE POLICY "Branch managers can update transactions" ON public.pawn_transactions FOR UPDATE TO authenticated
  USING (public.has_branch_access(branch_id));

-- INTEREST_RATES policies
CREATE POLICY "Authenticated can view active rates" ON public.interest_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Superadmin full access rates" ON public.interest_rates FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Admin can manage rates" ON public.interest_rates FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role]));

-- BLACKLIST policies
CREATE POLICY "Superadmin full access blacklist" ON public.blacklist FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Branch members can view blacklist" ON public.blacklist FOR SELECT TO authenticated
  USING (public.has_branch_access(branch_id));
CREATE POLICY "Manager can manage blacklist" ON public.blacklist FOR INSERT TO authenticated
  WITH CHECK (public.has_branch_access(branch_id) AND public.has_any_role(auth.uid(), ARRAY['MANAGER'::app_role, 'ADMIN'::app_role]));
CREATE POLICY "Manager can update blacklist" ON public.blacklist FOR UPDATE TO authenticated
  USING (public.has_branch_access(branch_id) AND public.has_any_role(auth.uid(), ARRAY['MANAGER'::app_role, 'ADMIN'::app_role]));

-- BRANCH_REQUESTS policies
CREATE POLICY "Superadmin full access requests" ON public.branch_requests FOR ALL TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Users can view own requests" ON public.branch_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());
CREATE POLICY "Admin can view all requests" ON public.branch_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role]));
CREATE POLICY "Admin can create requests" ON public.branch_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ADMIN'::app_role]));
CREATE POLICY "Superadmin can update requests" ON public.branch_requests FOR UPDATE TO authenticated
  USING (public.is_superadmin());

-- AUDIT_LOGS policies
CREATE POLICY "Superadmin can view all logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_superadmin());
CREATE POLICY "Anyone can insert logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- DASHBOARD_WIDGETS policies
CREATE POLICY "Users can manage own widgets" ON public.dashboard_widgets FOR ALL TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Superadmin full access widgets" ON public.dashboard_widgets FOR ALL TO authenticated
  USING (public.is_superadmin());

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pawn_transactions_updated_at BEFORE UPDATE ON public.pawn_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interest_rates_updated_at BEFORE UPDATE ON public.interest_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branch_requests_updated_at BEFORE UPDATE ON public.branch_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pawn ID sequence
CREATE SEQUENCE IF NOT EXISTS public.pawn_id_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_pawn_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pawn_id IS NULL OR NEW.pawn_id = '' THEN
    NEW.pawn_id := 'PW' || LPAD(nextval('public.pawn_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_pawn_id_trigger
  BEFORE INSERT ON public.pawn_transactions
  FOR EACH ROW EXECUTE FUNCTION public.generate_pawn_id();
