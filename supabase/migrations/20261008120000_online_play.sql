-- Pass the Phone online play: guest and email accounts, friends, private lobbies.
--
-- How a game runs online: the host's browser runs the game. Other players send
-- actions with send_action(). The host reads them, updates the game, and saves
-- it with host_commit(): the public state goes in lobbies.state, each player's
-- private info goes in lobby_secrets, and the host's full copy goes in
-- lobby_host_state so another member can take over if the host drops out.
--
-- Every table has row level security. Signed-in users can only read rows that
-- concern them, and every write goes through the functions below.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- ---------- Helpers ----------

-- Random code from consonants only, so codes never spell words.
create or replace function private.rand_code(n int)
returns text language plpgsql volatile set search_path = '' as $$
declare
  abc constant text := 'BCDFGHJKLMNPQRSTVWXZ';
  b bytea := extensions.gen_random_bytes(n);
  s text := '';
begin
  for i in 0 .. n - 1 loop
    s := s || substr(abc, 1 + get_byte(b, i) % 20, 1);
  end loop;
  return s;
end $$;

-- Same rules as Party.cleanName in shared/party.js, plus a fallback.
create or replace function private.clean_name(t text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(left(btrim(regexp_replace(regexp_replace(coalesce(t, ''), '[[:cntrl:]]', '', 'g'), '\s+', ' ', 'g')), 18)), ''), 'Player');
$$;

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Player' check (char_length(name) between 1 and 18),
  friend_code text not null unique check (friend_code ~ '^[A-Z]{6}$'),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
create unique index friendships_pair_key on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index friendships_addressee_idx on public.friendships (addressee);

create table public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{5}$'),
  game text not null check (game ~ '^[a-z0-9-]{2,32}$'),
  host_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'playing', 'closed')),
  max_players int not null default 8 check (max_players between 2 and 16),
  state jsonb not null default '{}'::jsonb,
  rev int not null default 0,
  members_rev int not null default 0,
  banned uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lobbies_host_idx on public.lobbies (host_id, created_at);
create index lobbies_updated_idx on public.lobbies (updated_at);

create table public.lobby_members (
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  seat int not null,
  joined_at timestamptz not null default now(),
  primary key (lobby_id, user_id)
);
create index lobby_members_user_idx on public.lobby_members (user_id);

create table public.lobby_secrets (
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev int not null default 0,
  primary key (lobby_id, user_id)
);
create index lobby_secrets_user_idx on public.lobby_secrets (user_id);

create table public.lobby_host_state (
  lobby_id uuid primary key references public.lobbies (id) on delete cascade,
  data jsonb,
  updated_at timestamptz not null default now()
);

create table public.lobby_actions (
  id bigint generated always as identity primary key,
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  data jsonb not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index lobby_actions_lobby_idx on public.lobby_actions (lobby_id, id);
create index lobby_actions_user_idx on public.lobby_actions (user_id, created_at);

create table public.invites (
  id bigint generated always as identity primary key,
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  game text not null,
  from_name text not null,
  created_at timestamptz not null default now(),
  unique (lobby_id, to_id)
);
create index invites_to_idx on public.invites (to_id);
create index invites_from_idx on public.invites (from_id, created_at);

-- Failed join attempts, to slow down code guessing. Not exposed to the API.
create table private.join_misses (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index join_misses_idx on private.join_misses (user_id, at);

-- ---------- Access helpers (security definer so policies do not recurse) ----------

create or replace function private.is_member(l uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lobby_members m where m.lobby_id = l and m.user_id = (select auth.uid()));
$$;

create or replace function private.is_host(l uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lobbies x where x.id = l and x.host_id = (select auth.uid()));
$$;

-- Realtime topics: lobby:<id> for members of that lobby, user:<id> for that user.
create or replace function private.can_use_topic(t text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when t like 'lobby:%' then exists (
      select 1 from public.lobby_members m
      where m.lobby_id::text = substr(t, 7) and m.user_id = (select auth.uid()))
    when t like 'user:%' then substr(t, 6) = (select auth.uid())::text
    else false
  end;
$$;

-- ---------- Row level security: read only, and only what concerns you ----------

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.lobbies enable row level security;
alter table public.lobby_members enable row level security;
alter table public.lobby_secrets enable row level security;
alter table public.lobby_host_state enable row level security;
alter table public.lobby_actions enable row level security;
alter table public.invites enable row level security;

create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Read own friendships" on public.friendships
  for select to authenticated using ((select auth.uid()) in (requester, addressee));
create policy "Members read their lobby" on public.lobbies
  for select to authenticated using (private.is_member(id));
create policy "Members read the member list" on public.lobby_members
  for select to authenticated using (private.is_member(lobby_id));
create policy "Players read their own secret" on public.lobby_secrets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Host reads the host state" on public.lobby_host_state
  for select to authenticated using (private.is_host(lobby_id));
create policy "Host reads actions" on public.lobby_actions
  for select to authenticated using (private.is_host(lobby_id));
create policy "Read own invites" on public.invites
  for select to authenticated using ((select auth.uid()) in (to_id, from_id));

revoke all on public.profiles, public.friendships, public.lobbies, public.lobby_members,
  public.lobby_secrets, public.lobby_host_state, public.lobby_actions, public.invites
  from anon, authenticated;
grant select on public.profiles, public.friendships, public.lobbies, public.lobby_members,
  public.lobby_secrets, public.lobby_host_state, public.lobby_actions, public.invites
  to authenticated;

-- ---------- New users get a profile ----------

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  for i in 1 .. 10 loop
    begin
      insert into public.profiles (id, name, friend_code)
      values (new.id, private.clean_name(new.raw_user_meta_data ->> 'name'), private.rand_code(6));
      return new;
    exception when unique_violation then
      if i = 10 then raise; end if;
    end;
  end loop;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- Account ----------

-- Your profile plus badge counts. Also marks you as online, so the site calls it
-- every half minute while a page is open.
create or replace function public.me(p_name text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  p public.profiles;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into p from public.profiles where id = uid;
  if not found then
    -- The sign-up trigger normally makes this. This covers anything it missed.
    for i in 1 .. 10 loop
      begin
        insert into public.profiles (id, name, friend_code)
        values (uid, private.clean_name(p_name), private.rand_code(6))
        returning * into p;
        exit;
      exception when unique_violation then
        select * into p from public.profiles where id = uid;
        exit when found;
      end;
    end loop;
  end if;
  update public.profiles set last_seen = now() where id = uid;
  return jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'friend_code', p.friend_code,
    'invites', (select count(*) from public.invites where to_id = uid),
    'requests', (select count(*) from public.friendships where addressee = uid and status = 'pending'));
end $$;

create or replace function public.set_name(p_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  n text := private.clean_name(p_name);
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  update public.profiles set name = n where id = uid;
  -- Waiting rooms show the new name straight away. Games in progress keep the old one.
  update public.lobby_members m set name = n
    from public.lobbies l
    where m.user_id = uid and l.id = m.lobby_id and l.status = 'open';
  update public.lobbies l set members_rev = members_rev + 1, updated_at = now()
    where l.status = 'open'
      and exists (select 1 from public.lobby_members m where m.lobby_id = l.id and m.user_id = uid);
  return n;
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  delete from auth.users where id = uid;
end $$;

-- Called by the keep-alive job so the free project does not pause.
create or replace function public.keepalive()
returns text language sql stable set search_path = '' as $$
  select 'ok'::text;
$$;

-- ---------- Lobbies ----------

create or replace function public.create_lobby(p_game text, p_max int default 8)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.lobbies;
  n text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if coalesce(p_game, '') !~ '^[a-z0-9-]{2,32}$' then raise exception 'bad_request'; end if;
  if (select count(*) from public.lobbies where host_id = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'slow_down';
  end if;
  select name into n from public.profiles where id = uid;
  if n is null then raise exception 'no_profile'; end if;
  for i in 1 .. 10 loop
    begin
      insert into public.lobbies (code, game, host_id, max_players)
      values (private.rand_code(5), p_game, uid, least(greatest(coalesce(p_max, 8), 2), 16))
      returning * into l;
      exit;
    exception when unique_violation then
      if i = 10 then raise; end if;
    end;
  end loop;
  insert into public.lobby_members (lobby_id, user_id, name, seat) values (l.id, uid, n, 0);
  insert into public.lobby_host_state (lobby_id) values (l.id);
  return jsonb_build_object('id', l.id, 'code', l.code, 'game', l.game);
end $$;

-- Expected problems come back as {"error": "..."} rather than an exception,
-- so failed guesses can be counted.
create or replace function public.join_lobby(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z]', '', 'g'));
  l public.lobbies;
  n text;
  base text;
  k int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if (select count(*) from private.join_misses where user_id = uid and at > now() - interval '10 minutes') >= 20 then
    return jsonb_build_object('error', 'slow_down');
  end if;
  select * into l from public.lobbies where code = c for update;
  if not found or l.status = 'closed' then
    insert into private.join_misses (user_id) values (uid);
    return jsonb_build_object('error', 'not_found');
  end if;
  if exists (select 1 from public.lobby_members where lobby_id = l.id and user_id = uid) then
    return jsonb_build_object('id', l.id, 'code', l.code, 'game', l.game);
  end if;
  if uid = any (l.banned) then return jsonb_build_object('error', 'removed', 'game', l.game); end if;
  if l.status <> 'open' then return jsonb_build_object('error', 'started', 'game', l.game); end if;
  if (select count(*) from public.lobby_members where lobby_id = l.id) >= l.max_players then
    return jsonb_build_object('error', 'full', 'game', l.game);
  end if;
  select name into n from public.profiles where id = uid;
  if n is null then raise exception 'no_profile'; end if;
  -- Two players with the same name become "Sam" and "Sam 2".
  if exists (select 1 from public.lobby_members where lobby_id = l.id and lower(name) = lower(n)) then
    base := rtrim(left(n, 15));
    k := 2;
    while exists (select 1 from public.lobby_members where lobby_id = l.id and lower(name) = lower(base || ' ' || k)) loop
      k := k + 1;
    end loop;
    n := base || ' ' || k;
  end if;
  insert into public.lobby_members (lobby_id, user_id, name, seat)
  values (l.id, uid, n, coalesce((select max(seat) + 1 from public.lobby_members where lobby_id = l.id), 0));
  update public.lobbies set members_rev = members_rev + 1, updated_at = now() where id = l.id;
  delete from public.invites where lobby_id = l.id and to_id = uid;
  return jsonb_build_object('id', l.id, 'code', l.code, 'game', l.game);
end $$;

create or replace function public.leave_lobby(p_lobby uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.lobbies;
  nxt uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into l from public.lobbies where id = p_lobby for update;
  if not found then return; end if;
  delete from public.lobby_members where lobby_id = l.id and user_id = uid;
  if not found then return; end if;
  delete from public.lobby_secrets where lobby_id = l.id and user_id = uid;
  if l.host_id = uid then
    select user_id into nxt from public.lobby_members where lobby_id = l.id order by seat limit 1;
    if nxt is null then
      update public.lobbies set status = 'closed', members_rev = members_rev + 1, updated_at = now() where id = l.id;
    else
      update public.lobbies set host_id = nxt, members_rev = members_rev + 1, updated_at = now() where id = l.id;
    end if;
  else
    update public.lobbies set members_rev = members_rev + 1, updated_at = now() where id = l.id;
  end if;
end $$;

create or replace function public.kick_player(p_lobby uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from public.lobbies where id = p_lobby and host_id = uid) then
    raise exception 'not_host';
  end if;
  if p_user is null or p_user = uid then raise exception 'bad_request'; end if;
  delete from public.lobby_members where lobby_id = p_lobby and user_id = p_user;
  delete from public.lobby_secrets where lobby_id = p_lobby and user_id = p_user;
  update public.lobbies
    set banned = case when p_user = any (banned) then banned else array_append(banned, p_user) end,
        members_rev = members_rev + 1, updated_at = now()
    where id = p_lobby;
end $$;

-- A member can take over when the host has not been seen for 45 seconds.
create or replace function public.claim_host(p_lobby uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.lobbies;
begin
  if uid is null or not private.is_member(p_lobby) then raise exception 'not_member'; end if;
  select * into l from public.lobbies where id = p_lobby for update;
  if l.host_id = uid then return true; end if;
  if exists (
    select 1 from public.lobby_members m join public.profiles p on p.id = m.user_id
    where m.lobby_id = p_lobby and m.user_id = l.host_id and p.last_seen > now() - interval '45 seconds'
  ) then
    return false;
  end if;
  update public.lobbies set host_id = uid, members_rev = members_rev + 1, updated_at = now() where id = p_lobby;
  return true;
end $$;

-- The host saves the game. Secrets are written before the public state so a
-- player's private info lands no later than the state that needs it.
create or replace function public.host_commit(
  p_lobby uuid,
  p_state jsonb,
  p_secrets jsonb default null,
  p_host jsonb default null,
  p_done bigint[] default null,
  p_status text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.lobbies;
  r int;
begin
  select * into l from public.lobbies where id = p_lobby for update;
  if not found or uid is null or l.host_id <> uid then raise exception 'not_host'; end if;
  if p_status is not null and p_status not in ('open', 'playing') then raise exception 'bad_request'; end if;
  if p_secrets is not null and jsonb_typeof(p_secrets) <> 'object' then raise exception 'bad_request'; end if;
  if coalesce(pg_column_size(p_state), 0) > 100000
     or coalesce(pg_column_size(p_secrets), 0) > 200000
     or coalesce(pg_column_size(p_host), 0) > 300000 then
    raise exception 'too_big';
  end if;
  r := l.rev + 1;
  if p_secrets is not null then
    insert into public.lobby_secrets (lobby_id, user_id, data, rev)
    select p_lobby, m.user_id, s.value, r
    from jsonb_each(p_secrets) s
    join public.lobby_members m on m.lobby_id = p_lobby and m.user_id::text = s.key
    on conflict (lobby_id, user_id) do update set data = excluded.data, rev = excluded.rev;
  end if;
  if p_host is not null then
    update public.lobby_host_state set data = p_host, updated_at = now() where lobby_id = p_lobby;
  end if;
  if p_done is not null then
    update public.lobby_actions set done = true where lobby_id = p_lobby and id = any (p_done);
  end if;
  update public.lobbies
    set state = coalesce(p_state, state), rev = r, status = coalesce(p_status, status), updated_at = now()
    where id = p_lobby;
  return r;
end $$;

create or replace function public.send_action(p_lobby uuid, p_data jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  new_id bigint;
begin
  if uid is null or not private.is_member(p_lobby) then raise exception 'not_member'; end if;
  if p_data is null or pg_column_size(p_data) > 4000 then raise exception 'too_big'; end if;
  if (select count(*) from public.lobby_actions
      where user_id = uid and created_at > now() - interval '10 seconds') >= 40 then
    raise exception 'slow_down';
  end if;
  insert into public.lobby_actions (lobby_id, user_id, data) values (p_lobby, uid, p_data) returning id into new_id;
  return new_id;
end $$;

-- ---------- Friends ----------

create or replace function private.befriend(me uuid, them uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare f public.friendships;
begin
  if them = me then return 'self'; end if;
  select * into f from public.friendships
    where (requester = me and addressee = them) or (requester = them and addressee = me);
  if found then
    if f.status = 'accepted' then return 'already'; end if;
    if f.requester = them then
      update public.friendships set status = 'accepted' where requester = them and addressee = me;
      return 'accepted';
    end if;
    return 'sent';
  end if;
  if (select count(*) from public.friendships where requester = me and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'slow_down';
  end if;
  insert into public.friendships (requester, addressee) values (me, them);
  return 'sent';
end $$;

-- Returns sent, accepted, already, self or not_found.
create or replace function public.add_friend(p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  them uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select id into them from public.profiles
    where friend_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z]', '', 'g'));
  if them is null then return 'not_found'; end if;
  return private.befriend(uid, them);
end $$;

-- Add someone you are in a lobby with.
create or replace function public.add_lobby_friend(p_lobby uuid, p_user uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not private.is_member(p_lobby)
     or not exists (select 1 from public.lobby_members where lobby_id = p_lobby and user_id = p_user) then
    return 'not_found';
  end if;
  return private.befriend(uid, p_user);
end $$;

create or replace function public.answer_friend(p_user uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_accept then
    update public.friendships set status = 'accepted'
      where requester = p_user and addressee = uid and status = 'pending';
  else
    delete from public.friendships where requester = p_user and addressee = uid and status = 'pending';
  end if;
end $$;

create or replace function public.remove_friend(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  delete from public.friendships
    where (requester = uid and addressee = p_user) or (requester = p_user and addressee = uid);
end $$;

-- Friends and requests. last_seen is only shared between accepted friends.
create or replace function public.my_friends()
returns table (id uuid, name text, status text, last_seen timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name,
    case when f.status = 'accepted' then 'friend' when f.requester = (select auth.uid()) then 'sent' else 'received' end,
    case when f.status = 'accepted' then p.last_seen end
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = (select auth.uid()) then f.addressee else f.requester end
  where (select auth.uid()) in (f.requester, f.addressee)
  order by 3, 2;
$$;

-- ---------- Invites ----------

create or replace function public.invite_friend(p_lobby uuid, p_user uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.lobbies;
  n text;
begin
  if uid is null or not private.is_member(p_lobby) then raise exception 'not_member'; end if;
  if not exists (select 1 from public.friendships where status = 'accepted'
                 and ((requester = uid and addressee = p_user) or (requester = p_user and addressee = uid))) then
    return 'not_friends';
  end if;
  select * into l from public.lobbies where id = p_lobby;
  if l.status <> 'open' then return 'started'; end if;
  if exists (select 1 from public.lobby_members where lobby_id = p_lobby and user_id = p_user) then return 'here'; end if;
  if (select count(*) from public.invites where from_id = uid and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'slow_down';
  end if;
  select name into n from public.profiles where id = uid;
  -- Delete then insert, so the friend gets a fresh insert event every time.
  delete from public.invites where lobby_id = p_lobby and to_id = p_user;
  insert into public.invites (lobby_id, from_id, to_id, code, game, from_name)
  values (p_lobby, uid, p_user, l.code, l.game, n);
  return 'sent';
end $$;

create or replace function public.dismiss_invite(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.invites where id = p_id and to_id = (select auth.uid());
end $$;

-- ---------- Function access ----------

revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_member(uuid), private.is_host(uuid), private.can_use_topic(text) to authenticated;
grant execute on function
  public.me(text), public.set_name(text), public.delete_my_account(),
  public.create_lobby(text, int), public.join_lobby(text), public.leave_lobby(uuid),
  public.kick_player(uuid, uuid), public.claim_host(uuid),
  public.host_commit(uuid, jsonb, jsonb, jsonb, bigint[], text), public.send_action(uuid, jsonb),
  public.add_friend(text), public.add_lobby_friend(uuid, uuid), public.answer_friend(uuid, boolean),
  public.remove_friend(uuid), public.my_friends(),
  public.invite_friend(uuid, uuid), public.dismiss_invite(bigint)
  to authenticated;
grant execute on function public.keepalive() to anon, authenticated;

-- ---------- Realtime ----------

-- Players get lobby updates and their own secret as Postgres changes. Row level
-- security decides who receives each change.
alter publication supabase_realtime add table
  public.lobbies, public.lobby_secrets, public.lobby_actions, public.invites;

-- ---------- Tidying ----------

select cron.schedule('ptp-tidy-lobbies', '*/10 * * * *', $job$
  delete from public.lobbies
    where updated_at < now() - interval '6 hours'
       or (status = 'closed' and updated_at < now() - interval '15 minutes');
  delete from public.invites where created_at < now() - interval '2 hours';
  delete from public.lobby_actions where done and created_at < now() - interval '30 minutes';
  delete from private.join_misses where at < now() - interval '1 hour';
$job$);

-- Guest accounts nobody has used for 30 days.
select cron.schedule('ptp-tidy-guests', '17 3 * * *', $job$
  delete from auth.users u
    where u.is_anonymous
      and u.created_at < now() - interval '30 days'
      and not exists (select 1 from public.profiles p where p.id = u.id and p.last_seen > now() - interval '30 days');
$job$);
