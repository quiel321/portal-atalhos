-- Execute no SQL Editor do Supabase. Pode ser executado novamente.
-- Antes: Authentication > Users > Add user: quiel321@gmail.com, senha escolhida por você, Auto Confirm User.
begin;
create table if not exists public.portal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portal_admins enable row level security;
revoke all on public.portal_admins from anon, authenticated;
grant select on public.portal_admins to authenticated;
drop policy if exists "portal_admin_read_own" on public.portal_admins;
create policy "portal_admin_read_own" on public.portal_admins for select to authenticated using (user_id = (select auth.uid()));

do $$
begin
  if not exists (select 1 from auth.users where lower(email) = 'quiel321@gmail.com') then
    raise exception 'Crie quiel321@gmail.com em Authentication > Users > Add user e execute este script novamente.';
  end if;
  insert into public.portal_admins(user_id) select id from auth.users where lower(email) = 'quiel321@gmail.com' on conflict (user_id) do nothing;
end $$;

create or replace function public.is_portal_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.portal_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to anon, authenticated;

-- Substitui somente as regras da tabela de atalhos. Os registros são preservados.
alter table public.atalhos_links enable row level security;
do $$ declare rule record; begin
  for rule in select policyname from pg_policies where schemaname = 'public' and tablename = 'atalhos_links' loop
    execute format('drop policy %I on public.atalhos_links', rule.policyname);
  end loop;
end $$;
revoke all on public.atalhos_links from anon, authenticated;
grant select on public.atalhos_links to anon, authenticated;
grant insert, update, delete on public.atalhos_links to authenticated;
-- Concede acesso somente à sequência do id, caso seja serial/identity.
do $$ declare sequence_name text; begin
  sequence_name := pg_get_serial_sequence('public.atalhos_links', 'id');
  if sequence_name is not null then
    execute format('grant usage, select on sequence %s to authenticated', sequence_name);
  end if;
end $$;
create policy "portal_public_read" on public.atalhos_links for select to anon, authenticated using (true);
create policy "portal_admin_insert" on public.atalhos_links for insert to authenticated with check ((select public.is_portal_admin()));
create policy "portal_admin_update" on public.atalhos_links for update to authenticated using ((select public.is_portal_admin())) with check ((select public.is_portal_admin()));
create policy "portal_admin_delete" on public.atalhos_links for delete to authenticated using ((select public.is_portal_admin()));

-- As regras restritivas impedem que regras antigas abertas liberem este bucket.
-- Outros buckets mantêm suas regras atuais.
drop policy if exists "portal_storage_insert_guard" on storage.objects;
drop policy if exists "portal_storage_update_guard" on storage.objects;
drop policy if exists "portal_storage_delete_guard" on storage.objects;
create policy "portal_storage_insert_guard" on storage.objects as restrictive for insert to public with check (bucket_id <> 'logos-portalatalhos' or (select public.is_portal_admin()));
create policy "portal_storage_update_guard" on storage.objects as restrictive for update to public using (bucket_id <> 'logos-portalatalhos' or (select public.is_portal_admin())) with check (bucket_id <> 'logos-portalatalhos' or (select public.is_portal_admin()));
create policy "portal_storage_delete_guard" on storage.objects as restrictive for delete to public using (bucket_id <> 'logos-portalatalhos' or (select public.is_portal_admin()));
drop policy if exists "portal_storage_admin_write" on storage.objects;
create policy "portal_storage_admin_write" on storage.objects for all to authenticated using (bucket_id = 'logos-portalatalhos' and (select public.is_portal_admin())) with check (bucket_id = 'logos-portalatalhos' and (select public.is_portal_admin()));
commit;
select 'Administrador autorizado e cadastro público bloqueado.' as resultado;
