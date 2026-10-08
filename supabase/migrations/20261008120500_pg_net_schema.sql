-- Keep pg_net out of the public API schema. Its functions still live in "net".
drop extension if exists pg_net;
create extension pg_net with schema extensions;
