-- Execute este script no SQL Editor do mesmo projeto Supabase.
-- Preserva os links e importa suas categorias atuais.
begin;
create table if not exists public.portal_categories (
  nome text primary key check (length(btrim(nome)) between 1 and 80 and nome = btrim(nome)),
  created_at timestamptz not null default now()
);
update public.atalhos_links set categoria = coalesce(nullif(btrim(categoria), ''), 'Outros atalhos');
insert into public.portal_categories(nome) select distinct categoria from public.atalhos_links on conflict (nome) do nothing;
insert into public.portal_categories(nome) values ('Propaganda') on conflict (nome) do nothing;
alter table public.portal_categories enable row level security;
revoke all on public.portal_categories from anon, authenticated;
grant select, insert, update, delete on public.portal_categories to authenticated;
drop policy if exists "portal_categories_read" on public.portal_categories;
drop policy if exists "portal_categories_write" on public.portal_categories;
create policy "portal_categories_read" on public.portal_categories for select to authenticated using ((select public.is_portal_admin()));
create policy "portal_categories_write" on public.portal_categories for all to authenticated using (nome <> 'Propaganda' and (select public.is_portal_admin())) with check (nome <> 'Propaganda' and (select public.is_portal_admin()));
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'atalhos_links_categoria_fkey' and conrelid = 'public.atalhos_links'::regclass) then
    alter table public.atalhos_links add constraint atalhos_links_categoria_fkey foreign key (categoria) references public.portal_categories(nome) on update cascade on delete restrict;
  end if;
end $$;
commit;
select 'Categorias prontas. Renomear move os links; categorias com links não podem ser excluídas.' as resultado;
