-- Add commission fields to orders table
ALTER TABLE public.orders ADD COLUMN commission_rate NUMERIC(5,4) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN commission_amount NUMERIC(10,2) DEFAULT 0.00;