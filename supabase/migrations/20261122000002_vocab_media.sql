-- Vocabulary cards: a picture and a recorded pronunciation.
--   image_path        file in the private 'attachments' bucket: <user_id>/vocab/<file>
--   image_credit      author/licence line for pictures found online
--   audio_url         recording of a real speaker (from a free dictionary), if one exists
--   audio_checked_at  when we last looked, so each word is looked up once
alter table public.lrn_cards
  add column image_path       text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/vocab/[A-Za-z0-9._-]+$'),
  add column image_credit     text check (length(image_credit) <= 300),
  add column audio_url        text check (audio_url is null or audio_url like 'https://%'),
  add column audio_checked_at timestamptz;
