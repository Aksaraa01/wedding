-- Withdraw the Navy Love template.
--
-- The template was registered by 20261047000000_navy_love.sql and pulled from
-- the library after review: the port did not reach the reference's fidelity
-- (docs/REA_NAVY_IVORY.md is kept as the record, marked withdrawn).
--
-- Deleting the row also removes it from /templates and from the template
-- picker. Any profile still pointing at it is detached first so the foreign key
-- cannot block the delete.
UPDATE public.wedding_profiles
   SET selected_template_id = NULL
 WHERE selected_template_id IN (SELECT id FROM public.web_templates WHERE code = 'navy-love');

DELETE FROM public.web_templates WHERE code = 'navy-love';
