-- Guest invitation link access mode per couple.
-- true  = Terbatas: ?to= must match a guest slug (or qr_token), else 404.
-- false = Fleksibel: any ?to= renders; name shown prettified from the slug.
-- Default true preserves existing behavior for all current couples.
ALTER TABLE wedding_profiles
  ADD COLUMN IF NOT EXISTS guest_link_strict BOOLEAN NOT NULL DEFAULT true;
