-- Run once in the Supabase SQL editor. Only the backend service role can access this single-user store.
begin;
create table if not exists public.workbench_state(id text primary key, payload jsonb not null);
alter table public.workbench_state enable row level security;
revoke all on public.workbench_state from anon, authenticated;
grant all on public.workbench_state to service_role;
insert into public.workbench_state values ('main','{"version":0,"projects":[],"records":[],"sessions":[],"proposals":[],"events":[],"usage":{}}') on conflict do nothing;
create or replace function public.save_workbench(expected_version integer, next_payload jsonb)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 if (next_payload->>'version')::integer <> expected_version+1 then raise exception 'invalid version'; end if;
 update public.workbench_state set payload=next_payload where id='main' and (payload->>'version')::integer=expected_version;
 return found;
end $$;
revoke all on function public.save_workbench(integer,jsonb) from public, anon, authenticated;
grant execute on function public.save_workbench(integer,jsonb) to service_role;
commit;

-- This result contains no research content or credentials.
select
  exists(select 1 from public.workbench_state where id='main') as initialized,
  (select relrowsecurity from pg_class where oid='public.workbench_state'::regclass) as rls_enabled,
  has_table_privilege('anon','public.workbench_state','SELECT') as anonymous_can_read,
  has_function_privilege('anon','public.save_workbench(integer,jsonb)','EXECUTE') as anonymous_can_write;
