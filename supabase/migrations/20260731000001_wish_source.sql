-- Track where a wish was submitted from so wish-wall displays can exclude
-- wishes made from the /welcome check-in page and only show web-invitation wishes.

ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS source character varying DEFAULT 'invitation';
