CREATE TABLE public.payout_accounts (
  user_id uuid PRIMARY KEY,
  mpesa_phone text NOT NULL,
  account_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payout_accounts TO authenticated;
GRANT ALL ON public.payout_accounts TO service_role;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payout account read" ON public.payout_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own payout account insert" ON public.payout_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own payout account update" ON public.payout_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  mpesa_reference text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or admin read payouts" ON public.payouts FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin record payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lender_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','declined')),
  offered_apr numeric,
  offered_term_months integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lender_decisions TO authenticated;
GRANT ALL ON public.lender_decisions TO service_role;
ALTER TABLE public.lender_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lender insert decision" ON public.lender_decisions FOR INSERT TO authenticated WITH CHECK (lender_id = auth.uid() AND public.has_role(auth.uid(),'lender'));
CREATE POLICY "read decisions" ON public.lender_decisions FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'lender') OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.finance_applications f WHERE f.id = application_id AND f.user_id = auth.uid()));

CREATE POLICY "lenders read applications" ON public.finance_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'lender'));
CREATE POLICY "lenders update applications" ON public.finance_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'lender')) WITH CHECK (public.has_role(auth.uid(),'lender'));

CREATE OR REPLACE FUNCTION public.notify_lender_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.finance_applications WHERE id = NEW.application_id;
  UPDATE public.finance_applications SET status = NEW.decision::finance_status WHERE id = NEW.application_id;
  IF v_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_user, 'finance', 'Loan application ' || NEW.decision, COALESCE(NEW.note,''), '/account');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_lender_decision AFTER INSERT ON public.lender_decisions FOR EACH ROW EXECUTE FUNCTION public.notify_lender_decision();

CREATE OR REPLACE FUNCTION public.notify_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.owner_id, 'payout', 'Payout sent', 'KSh ' || NEW.amount::text || COALESCE(' · ref ' || NEW.mpesa_reference,''), '/owner');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_payout AFTER INSERT ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.notify_payout();