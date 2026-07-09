ALTER TABLE "public"."goals" 
ADD COLUMN "linked_card_id" uuid REFERENCES "public"."bank_cards"("id") ON DELETE SET NULL,
ADD COLUMN "linked_wallet_id" uuid REFERENCES "public"."e_wallets"("id") ON DELETE SET NULL;;
