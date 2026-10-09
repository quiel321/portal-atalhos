-- Execute uma vez no SQL Editor do Supabase, depois do admin-setup.sql.
begin;
create table if not exists public.portal_super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.portal_super_admins enable row level security;
revoke all on public.portal_super_admins from public, anon, authenticated;
do $$ begin
  if not exists (select 1 from auth.users where lower(email) = 'quiel321@gmail.com') then
    raise exception 'A conta quiel321@gmail.com precisa existir primeiro.';
  end if;
  insert into public.portal_admins(user_id) select id from auth.users where lower(email) = 'quiel321@gmail.com' on conflict do nothing;
  insert into public.portal_super_admins(user_id) select id from auth.users where lower(email) = 'quiel321@gmail.com' on conflict do nothing;
end $$;
create or replace function public.is_portal_super_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.portal_super_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_portal_super_admin() from public, anon, authenticated;
grant execute on function public.is_portal_super_admin() to authenticated;

-- A lista só retorna dados de contas para o super-admin autenticado.
create or replace function public.portal_list_users(p_search text default '')
returns table(user_id uuid, email text, confirmed boolean, authorized boolean, super_admin boolean)
language plpgsql stable security definer set search_path = ''
as $$ begin
  if not public.is_portal_super_admin() then raise exception 'Acesso exclusivo do super-admin.' using errcode = '42501'; end if;
  return query select u.id, u.email::text, u.email_confirmed_at is not null,
    a.user_id is not null, s.user_id is not null
  from auth.users u left join public.portal_admins a on a.user_id = u.id
  left join public.portal_super_admins s on s.user_id = u.id
  where u.email is not null and position(lower(left(coalesce(p_search, ''), 254)) in lower(u.email)) > 0
  order by (a.user_id is not null), u.created_at desc limit 100;
end $$;
create or replace function public.portal_set_user_access(p_user_id uuid, p_authorized boolean)
returns void language plpgsql security definer set search_path = ''
as $$ begin
  if not public.is_portal_super_admin() then raise exception 'Acesso exclusivo do super-admin.' using errcode = '42501'; end if;
  if p_authorized is null then raise exception 'Permissão inválida.'; end if;
  if exists(select 1 from public.portal_super_admins where user_id = p_user_id) then
    raise exception 'O acesso do super-admin está protegido.';
  end if;
  if not exists(select 1 from auth.users where id = p_user_id) then raise exception 'Conta não encontrada.'; end if;
  if p_authorized then
    if not exists(select 1 from auth.users where id = p_user_id and email_confirmed_at is not null) then
      raise exception 'O usuário precisa confirmar o e-mail primeiro.';
    end if;
    insert into public.portal_admins(user_id) values(p_user_id) on conflict do nothing;
  else
    delete from public.portal_admins where user_id = p_user_id;
  end if;
end $$;
revoke all on function public.portal_list_users(text) from public, anon, authenticated;
revoke all on function public.portal_set_user_access(uuid, boolean) from public, anon, authenticated;
grant execute on function public.portal_list_users(text), public.portal_set_user_access(uuid, boolean) to authenticated;
commit;
select 'Super-admin ativado: quiel321@gmail.com' as resultado;
