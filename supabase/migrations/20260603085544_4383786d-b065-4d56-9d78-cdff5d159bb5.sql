CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('grant','revoke')),
  target_user_id uuid NOT NULL,
  role app_role NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view role audit log"
  ON public.role_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log (created_at DESC);
CREATE INDEX idx_role_audit_log_target ON public.role_audit_log (target_user_id);

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (action, target_user_id, role, actor_id)
    VALUES ('grant', NEW.user_id, NEW.role, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (action, target_user_id, role, actor_id)
    VALUES ('revoke', OLD.user_id, OLD.role, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_log_role_change
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();