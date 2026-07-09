-- 1. Atomic Delete Transaction
CREATE OR REPLACE FUNCTION public.delete_transaction(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_tx record;
    v_cash_wallet_id uuid;
BEGIN
    -- 1. Get Transaction details (and verify ownership)
    SELECT * INTO v_tx FROM public.transactions WHERE id = p_id AND user_id = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or unauthorized';
    END IF;

    -- 2. Delete Transaction
    DELETE FROM public.transactions WHERE id = p_id;

    -- 3. Revert Balances
    IF v_tx.type = 'transfer' THEN
        -- Revert Transfer: Add back to source, deduct from destination
        PERFORM public.update_card_balance(v_tx.card_id, v_tx.amount);
        PERFORM public.update_wallet_balance(v_tx.wallet_id, v_tx.amount);
        PERFORM public.update_card_balance(v_tx.to_card_id, -v_tx.amount);
        PERFORM public.update_wallet_balance(v_tx.to_wallet_id, -v_tx.amount);
    ELSE
        -- Revert Income/Expense/Withdrawal
        DECLARE
            v_revert_delta numeric := CASE WHEN v_tx.type = 'income' THEN -v_tx.amount ELSE v_tx.amount END;
        BEGIN
            PERFORM public.update_card_balance(v_tx.card_id, v_revert_delta);
            PERFORM public.update_wallet_balance(v_tx.wallet_id, v_revert_delta);
            
            -- Revert cash side for withdrawal
            IF v_tx.type = 'withdrawal' THEN
                SELECT id INTO v_cash_wallet_id FROM public.e_wallets 
                WHERE user_id = v_tx.user_id AND wallet_type = 'cash' LIMIT 1;
                
                IF v_cash_wallet_id IS NOT NULL THEN
                    PERFORM public.update_wallet_balance(v_cash_wallet_id, -v_tx.amount);
                END IF;
            END IF;
        END;
    END IF;
END;
$function$;

-- 2. Atomic Update Transaction (Generic approach: Revert old and apply new)
-- This takes the new transaction data as arguments
CREATE OR REPLACE FUNCTION public.update_transaction(
    p_id uuid,
    p_type text,
    p_amount numeric,
    p_description text,
    p_transaction_date date,
    p_category_id uuid,
    p_payment_method text,
    p_card_id uuid DEFAULT NULL,
    p_wallet_id uuid DEFAULT NULL,
    p_to_card_id uuid DEFAULT NULL,
    p_to_wallet_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_old_tx record;
    v_cash_wallet_id uuid;
BEGIN
    -- 1. Get Old Transaction details (and verify ownership)
    SELECT * INTO v_old_tx FROM public.transactions WHERE id = p_id AND user_id = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or unauthorized';
    END IF;

    -- 2. Revert Old Balances
    IF v_old_tx.type = 'transfer' THEN
        PERFORM public.update_card_balance(v_old_tx.card_id, v_old_tx.amount);
        PERFORM public.update_wallet_balance(v_old_tx.wallet_id, v_old_tx.amount);
        PERFORM public.update_card_balance(v_old_tx.to_card_id, -v_old_tx.amount);
        PERFORM public.update_wallet_balance(v_old_tx.to_wallet_id, -v_old_tx.amount);
    ELSE
        DECLARE
            v_revert_delta numeric := CASE WHEN v_old_tx.type = 'income' THEN -v_old_tx.amount ELSE v_old_tx.amount END;
        BEGIN
            PERFORM public.update_card_balance(v_old_tx.card_id, v_revert_delta);
            PERFORM public.update_wallet_balance(v_old_tx.wallet_id, v_revert_delta);
            IF v_old_tx.type = 'withdrawal' THEN
                SELECT id INTO v_cash_wallet_id FROM public.e_wallets 
                WHERE user_id = v_old_tx.user_id AND wallet_type = 'cash' LIMIT 1;
                IF v_cash_wallet_id IS NOT NULL THEN
                    PERFORM public.update_wallet_balance(v_cash_wallet_id, -v_old_tx.amount);
                END IF;
            END IF;
        END;
    END IF;

    -- 3. Update Transaction Record
    UPDATE public.transactions SET
        type = p_type,
        amount = p_amount,
        description = p_description,
        transaction_date = p_transaction_date,
        category_id = p_category_id,
        payment_method = p_payment_method,
        card_id = p_card_id,
        wallet_id = p_wallet_id,
        to_card_id = p_to_card_id,
        to_wallet_id = p_to_wallet_id,
        updated_at = now()
    WHERE id = p_id;

    -- 4. Apply New Balances
    IF p_type = 'transfer' THEN
        PERFORM public.update_card_balance(p_card_id, -p_amount);
        PERFORM public.update_wallet_balance(p_wallet_id, -p_amount);
        PERFORM public.update_card_balance(p_to_card_id, p_amount);
        PERFORM public.update_wallet_balance(p_to_wallet_id, p_amount);
    ELSE
        DECLARE
            v_new_delta numeric := CASE WHEN p_type = 'income' THEN p_amount ELSE -p_amount END;
        BEGIN
            PERFORM public.update_card_balance(p_card_id, v_new_delta);
            PERFORM public.update_wallet_balance(p_wallet_id, v_new_delta);
            IF p_type = 'withdrawal' THEN
                SELECT id INTO v_cash_wallet_id FROM public.e_wallets 
                WHERE user_id = auth.uid() AND wallet_type = 'cash' LIMIT 1;
                IF v_cash_wallet_id IS NOT NULL THEN
                    PERFORM public.update_wallet_balance(v_cash_wallet_id, p_amount);
                END IF;
            END IF;
        END;
    END IF;
END;
$function$;
;
