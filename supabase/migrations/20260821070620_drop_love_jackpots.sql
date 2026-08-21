-- Drop unused love_jackpots table (orphan on staging/prod, no code references, 0 rows)
DROP TABLE IF EXISTS public.love_jackpots CASCADE;
