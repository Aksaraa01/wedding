-- Real-usage ranking, used to PREFILL the ops "Atur Top 10 Populer" panel.
--
-- The public shelf still reads web_templates.popular_rank (ops owns the final
-- order). This view only answers "what would the order be if we followed the
-- data?", so a fresh panel starts from reality instead of from sort_order:
--   * a couple currently on the template  → 3 points (a standing choice)
--   * every WP duplicate job (a pick)     → 1 point  (WP templates only)
--   * a submitted feedback                → 1 point
--
-- security_invoker + revoked grants keep the counts off the public PostgREST
-- surface; only the service role (server routes) can read it.

CREATE OR REPLACE VIEW public.web_template_popularity
WITH (security_invoker = true) AS
SELECT
  t.id AS template_id,
  t.code,
  t.name,
  t.category,
  t.no_photo,
  (
    SELECT count(*) FROM public.wedding_profiles p
    WHERE p.selected_template_id = t.id
  ) AS selected_count,
  (
    SELECT count(*) FROM public.wp_sync_jobs j
    WHERE j.template_id = t.id AND j.kind = 'duplicate'
  ) AS pick_count,
  (
    SELECT count(*) FROM public.feedback_submissions f
    WHERE f.template_id = t.id
  ) AS feedback_count,
  (
    SELECT count(*) FROM public.wedding_profiles p
    WHERE p.selected_template_id = t.id
  ) * 3
  + (
    SELECT count(*) FROM public.wp_sync_jobs j
    WHERE j.template_id = t.id AND j.kind = 'duplicate'
  )
  + (
    SELECT count(*) FROM public.feedback_submissions f
    WHERE f.template_id = t.id
  ) AS score
FROM public.web_templates t
WHERE t.is_active;

REVOKE ALL ON public.web_template_popularity FROM anon, authenticated;
GRANT SELECT ON public.web_template_popularity TO service_role;
