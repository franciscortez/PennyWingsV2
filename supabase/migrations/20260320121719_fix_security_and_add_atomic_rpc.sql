-- 1. Fix update_card_balance to check ownership
CREATE OR REPLACE FUNCTION public.update_card_balance(p_id uuid, p_delta numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.bank_cards 
  set balance = balance + p_delta 
  where id = p_id and user_id = auth.uid();
end;
$function$;

-- 2. Fix update_wallet_balance to check ownership
CREATE OR REPLACE FUNCTION public.update_wallet_balance(p_id uuid, p_delta numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.e_wallets 
  set balance = balance + p_delta 
  where id = p_id and user_id = auth.uid();
end;
$function$;

-- 3. Fix categories RLS policy
-- Drop existing policy if it exists (assuming the name from pg_policies)
DROP POLICY IF EXISTS "Categories: Access default or own" ON public.categories;

CREATE POLICY "Categories: Access default or own" ON public.categories
FOR SELECT
TO authenticated
USING ((user_id IS NULL) OR (user_id = auth.uid()));

CREATE POLICY "Categories: Manage own categories" ON public.categories
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Create atomic process_transaction RPC
CREATE OR REPLACE FUNCTION public.process_transaction(
    p_type text,
    p_amount numeric,
    p_description text,
    p_transaction_date date,
    p_category_id uuid,
    p_payment_method text,
    p_card_id uuid DEFAULT NULL,
    p_wallet_id uuid DEFAULT NULL,
    p_to_card_id uuid DEFAULT NULL,
    p_to_wallet_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_tx_id uuid;
    v_cash_wallet_id uuid;
    v_result jsonb;
BEGIN
    -- Basic validation
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 1. Insert Transaction
    INSERT INTO public.transactions (
        user_id, type, amount, description, transaction_date, 
        category_id, payment_method, card_id, wallet_id, 
        to_card_id, to_wallet_id
    ) VALUES (
        p_user_id, p_type, p_amount, p_description, p_transaction_date,
        p_category_id, p_payment_method, p_card_id, p_wallet_id,
        p_to_card_id, p_to_wallet_id
    ) RETURNING id INTO v_tx_id;

    -- 2. Update Balances
    IF p_type = 'transfer' THEN
        -- Transfer: Deduct from source, add to destination
        PERFORM public.update_card_balance(p_card_id, -p_amount);
        PERFORM public.update_wallet_balance(p_wallet_id, -p_amount);
        PERFORM public.update_card_balance(p_to_card_id, p_amount);
        PERFORM public.update_wallet_balance(p_to_wallet_id, p_amount);
    ELSE
        -- Income/Expense/Withdrawal
        DECLARE
            v_delta numeric := CASE WHEN p_type = 'income' THEN p_amount ELSE -p_amount END;
        BEGIN
            PERFORM public.update_card_balance(p_card_id, v_delta);
            PERFORM public.update_wallet_balance(p_wallet_id, v_delta);
            
            -- Special case: Withdrawal adds to cash
            IF p_type = 'withdrawal' THEN
                SELECT id INTO v_cash_wallet_id FROM public.e_wallets 
                WHERE user_id = p_user_id AND wallet_type = 'cash' LIMIT 1;
                
                IF v_cash_wallet_id IS NOT NULL THEN
                    PERFORM public.update_wallet_balance(v_cash_wallet_id, p_amount);
                END IF;
            END IF;
        END;
    END IF;

    -- Construct return data
    SELECT jsonb_build_object('id', v_tx_id) INTO v_result;
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$;
;
