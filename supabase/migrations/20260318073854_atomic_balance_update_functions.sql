
-- Atomically update a bank card balance by a delta (positive = add, negative = subtract)
create or replace function update_card_balance(p_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
as $$
begin
  update bank_cards set balance = balance + p_delta where id = p_id;
end;
$$;

-- Atomically update an e-wallet balance by a delta (positive = add, negative = subtract)
create or replace function update_wallet_balance(p_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
as $$
begin
  update e_wallets set balance = balance + p_delta where id = p_id;
end;
$$;
;
