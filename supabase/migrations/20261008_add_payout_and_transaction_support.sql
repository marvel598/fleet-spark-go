CREATE TABLE IF NOT EXISTS public.payout_accounts (
  user_id uuid NOT NULL,
  account_name text,
  mpesa_phone text,
  payment_method text NOT NULL DEFAULT 'mpesa' CHECK (payment_method IN ('mpesa', 'bank_transfer')),
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.payout_accounts
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payout accounts"
  ON public.payout_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  partner_type text NOT NULL CHECK (partner_type IN ('dealer', 'owner', 'lender')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('buying', 'leasing')),
  gross_amount numeric NOT NULL DEFAULT 0,
  platform_commission numeric NOT NULL DEFAULT 0,
  payment_processing numeric NOT NULL DEFAULT 0,
  net_to_partner numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'mpesa' CHECK (payment_method IN ('mpesa', 'bank_transfer', 'stripe')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.transactions
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_partner_id
  ON public.transactions(partner_id);
