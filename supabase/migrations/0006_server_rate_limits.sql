-- 0006_server_rate_limits.sql — server-side (Postgres trigger) rate limiting
-- for the public-intake tables. The client-side token bucket in
-- src/lib/rate-limit.ts is real but is JS running in the caller's own
-- browser — trivially bypassed by calling the REST API directly. These
-- triggers enforce a hard backstop inside the database itself, which no
-- client can skip.

-- registrations: at most 5 submissions from the same phone number in 10 min —
-- generous for a real trader retrying a typo, hard stop against automation.
create or replace function public.enforce_registrations_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.registrations
  where phone = new.phone and created_at > now() - interval '10 minutes';
  if recent_count >= 5 then
    raise exception 'Muda mfupi mno kati ya usajili kutoka namba hii ya simu. Jaribu tena baadaye.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger registrations_rate_limit
  before insert on public.registrations
  for each row execute function public.enforce_registrations_rate_limit();

-- receipts: a system-wide circuit breaker against automated flooding. Real
-- traders issuing receipts one at a time never approach this ceiling.
create or replace function public.enforce_receipts_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.receipts
  where created_at > now() - interval '60 seconds';
  if recent_count >= 100 then
    raise exception 'Mfumo umepokea maombi mengi mno kwa sasa. Jaribu tena baada ya dakika chache.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger receipts_rate_limit
  before insert on public.receipts
  for each row execute function public.enforce_receipts_rate_limit();

-- disputes: same system-wide circuit breaker.
create or replace function public.enforce_disputes_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.disputes
  where created_at > now() - interval '60 seconds';
  if recent_count >= 20 then
    raise exception 'Mfumo umepokea maombi mengi mno kwa sasa. Jaribu tena baada ya dakika chache.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger disputes_rate_limit
  before insert on public.disputes
  for each row execute function public.enforce_disputes_rate_limit();
