-- Realtime makes realtime.messages the first time it starts, so these
-- policies go in after the main online_play migration.

-- Presence on private channels: lobby members on lobby:<id>, and you on user:<id>.
create policy "Members listen on their channels" on realtime.messages
  for select to authenticated
  using (realtime.messages.extension in ('presence', 'broadcast') and private.can_use_topic((select realtime.topic())));
create policy "Members send on their channels" on realtime.messages
  for insert to authenticated
  with check (realtime.messages.extension in ('presence', 'broadcast') and private.can_use_topic((select realtime.topic())));
