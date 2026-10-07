-- System-actor label for the ops timeline. Human actions keep resolving the
-- actor via changed_by_employee_id; automated actions (e.g. the daily
-- Proyek Selesai sweep) have no employee row and set actor_label instead
-- ("Aksaraa Sistem"), which the ops detail renders in the "Oleh" column.
alter table public.ops_queue_status_log
  add column if not exists actor_label text;
