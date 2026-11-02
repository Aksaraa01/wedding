-- Ops-owned position in the public "Top 10 Populer" template shelf.
--
-- Why a column instead of a live count: the gallery is ISR-cached for an hour
-- and the ops team wants to control the lineup (a template can be promoted for
-- a campaign without waiting for real pick counts). The value is seeded once
-- from actual usage so day one is not arbitrary:
--   * a couple currently on the template (wedding_profiles.selected_template_id)
--     weighs 3x — it is a live, standing choice;
--   * every WP duplicate job (wp_sync_jobs kind='duplicate') weighs 1x — it is
--     one pick event, and only WP templates produce one.
-- After this migration ops edits it from /ops/templates ("Galeri Publik").
--
-- "Top 10 Terbaru" needs no column: it is web_templates.created_at desc.

ALTER TABLE public.web_templates
  ADD COLUMN IF NOT EXISTS popular_rank integer;

-- Ranks are a position, never a pile: two templates cannot share slot 3.
CREATE UNIQUE INDEX IF NOT EXISTS web_templates_popular_rank_key
  ON public.web_templates (popular_rank)
  WHERE popular_rank IS NOT NULL;

WITH usage AS (
  SELECT
    t.id,
    t.sort_order,
    t.name,
    (
      SELECT count(*) FROM public.wedding_profiles p
      WHERE p.selected_template_id = t.id
    ) * 3
    + (
      SELECT count(*) FROM public.wp_sync_jobs j
      WHERE j.template_id = t.id AND j.kind = 'duplicate'
    ) AS score
  FROM public.web_templates t
  WHERE t.is_active
),
ranked AS (
  SELECT id, row_number() OVER (ORDER BY score DESC, sort_order ASC, name ASC) AS rn
  FROM usage
  WHERE score > 0
)
UPDATE public.web_templates t
SET popular_rank = r.rn
FROM ranked r
WHERE t.id = r.id
  AND r.rn <= 10
  AND t.popular_rank IS NULL;

-- Keep the shelf full on a quiet database: fill the remaining slots (by the
-- existing curated order) only while fewer than 10 templates carry a rank.
WITH missing AS (
  SELECT 10 - count(*) AS slots FROM public.web_templates WHERE popular_rank IS NOT NULL
),
next_slots AS (
  SELECT
    t.id,
    (SELECT count(*) FROM public.web_templates x WHERE x.popular_rank IS NOT NULL)
      + row_number() OVER (ORDER BY t.sort_order ASC, t.created_at DESC, t.name ASC) AS rn
  FROM public.web_templates t
  WHERE t.is_active
    AND t.popular_rank IS NULL
    AND (SELECT slots FROM missing) > 0
)
UPDATE public.web_templates t
SET popular_rank = n.rn
FROM next_slots n
WHERE t.id = n.id
  AND n.rn <= 10;
