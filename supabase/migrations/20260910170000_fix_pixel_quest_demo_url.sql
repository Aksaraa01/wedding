-- Fix pixel_quest demo_url: must match the registered component code (underscore).
UPDATE web_templates
SET demo_url = '/templates/pixel_quest/preview'
WHERE code = 'pixel_quest';