-- Add destination account columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN to_card_id uuid REFERENCES public.bank_cards(id),
ADD COLUMN to_wallet_id uuid REFERENCES public.e_wallets(id);

-- Update the type constraint to include 'transfer'
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'withdrawal'::text, 'transfer'::text]));
;
