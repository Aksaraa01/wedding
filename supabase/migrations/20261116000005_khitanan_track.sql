-- Kids default track: the qasidah khitanan recording the owner supplied.
-- Served from /defaults/khitanan.mp3 so both the wedding and Ceriavite hosts can
-- use it without a cross-origin audio request.
INSERT INTO web_tracks (title, artist, mood_category, audio_url, is_active, sort_order)
SELECT 'Khitanan (Qasidah Cover)', 'Dhesy Fitriani / Nasida Ria', 'khitanan',
       '/defaults/khitanan.mp3', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM web_tracks WHERE audio_url = '/defaults/khitanan.mp3'
);
