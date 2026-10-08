-- Free projects pause after a quiet week. Once a day, call the public keepalive
-- endpoint through the API, the same way a visitor would.
create extension if not exists pg_net;

select cron.schedule('ptp-keepalive', '41 5 * * *', $job$
  select net.http_post(
    url := 'https://dmfduvttrdyzkmrulbyp.supabase.co/rest/v1/rpc/keepalive',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_BxskYfphVX0V5qLjXMDl8A_MEWYlifa"}'::jsonb,
    body := '{}'::jsonb);
$job$);
