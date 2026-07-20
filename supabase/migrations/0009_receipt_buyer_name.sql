-- 0009_receipt_buyer_name.sql — EFD-Lite receipts capture the buyer's name,
-- not just their phone. Seller/issuer details aren't duplicated onto each
-- receipt row: they're already on trader_profiles via receipts.trader_id, so
-- the officer view and any future receipt export join to it instead.

alter table public.receipts add column buyer_name text;
