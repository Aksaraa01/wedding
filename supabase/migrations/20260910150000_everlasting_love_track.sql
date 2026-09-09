-- Default background track for in-house templates. The audio file must exist at
-- media/seeded/tracks/an-everlasting-love.mp3 (seeded per environment).

INSERT INTO web_tracks (title, artist, mood_category, audio_url, sort_order)
SELECT 'An Everlasting Love', 'Instrumental', 'modern-romantis',
       'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/tracks/an-everlasting-love.mp3',
       8
WHERE NOT EXISTS (SELECT 1 FROM web_tracks WHERE title = 'An Everlasting Love');