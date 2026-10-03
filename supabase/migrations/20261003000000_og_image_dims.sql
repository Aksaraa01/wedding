-- Measured dimensions of the og_image_url variant file. generateMetadata emits
-- width/height ONLY from these columns — never a declared box the file
-- doesn't fill (mismatched dims render zoomed-out in WhatsApp previews).
alter table public.wedding_profiles
  add column if not exists og_image_width int,
  add column if not exists og_image_height int;
