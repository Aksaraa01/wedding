-- Singer is optional on uploaded tracks: NULL artist means "hidden" in the
-- couple editor (no "Aksaraa"/"Lagu Saya"/"Instrumental" fallback).
-- Couple private uploads keep artist='Lagu Saya' (shown as "Lagu Saya" only
-- to the uploader via the isMine rule).

-- Placeholder on public tracks (couple uploads that were made public).
UPDATE web_tracks
SET artist = NULL
WHERE is_public = true AND artist = 'Lagu Saya';

-- Legacy admin-upload default.
UPDATE web_tracks
SET artist = NULL
WHERE is_custom = true AND uploaded_by IS NULL AND artist = 'Aksaraa';
