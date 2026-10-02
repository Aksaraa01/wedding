-- Forensics: which surface enqueued each WP sync job (dashboard couple flow vs
-- ops console). The Febrian/Vincent double-template incidents could not be
-- attributed because jobs carried no actor info.
alter table public.wp_sync_jobs add column if not exists source text;
