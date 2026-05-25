

grant usage on schema pmo to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema pmo
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema pmo
  to anon, authenticated, service_role;
grant execute on all functions in schema pmo
  to anon, authenticated, service_role;


alter default privileges in schema pmo
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;
alter default privileges in schema pmo
  grant usage, select on sequences
  to anon, authenticated, service_role;
alter default privileges in schema pmo
  grant execute on functions
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
