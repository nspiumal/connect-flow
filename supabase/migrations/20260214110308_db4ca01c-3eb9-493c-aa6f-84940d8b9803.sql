
-- Fix profiles INSERT to only allow creating own profile
DROP POLICY "Profiles can be created" ON public.profiles;
CREATE POLICY "Profiles can be created" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Fix audit_logs INSERT to set user_id
DROP POLICY "Anyone can insert logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
