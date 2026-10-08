-- Games you are still in, so the Online page can take you back to them.
create or replace function public.my_lobbies()
returns table (code text, game text, status text, host boolean, players int, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.code, l.game, l.status, l.host_id = (select auth.uid()),
    (select count(*)::int from public.lobby_members x where x.lobby_id = l.id), l.updated_at
  from public.lobby_members m
  join public.lobbies l on l.id = m.lobby_id
  where m.user_id = (select auth.uid()) and l.status <> 'closed'
  order by l.updated_at desc
  limit 10;
$$;
revoke execute on function public.my_lobbies() from public, anon;
grant execute on function public.my_lobbies() to authenticated;
