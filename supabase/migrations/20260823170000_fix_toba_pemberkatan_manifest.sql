-- Fix Toba Rossa (template-2) sessions[0].name mapping: was incorrectly 104e797c/background_image (container bg) -> should be 3df0805/title (heading "Pemberkatan")
-- This caused pemberkatan background to be overwritten with text "Akad" on duplicated posts, leaving background empty.
update public.web_templates
set wp_manifest = jsonb_set(
  wp_manifest,
  '{sessions,0,name}',
  '{"elementId": "3df0805", "settings": ["title"]}'::jsonb
)
where id = 'b9b72b20-1cbc-4be3-86a2-c1d9de9b7808'
  and wp_manifest #>> '{sessions,0,name,elementId}' = '104e797c';
