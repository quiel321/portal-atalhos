-- Execute no SQL Editor do Supabase para ativar as estatísticas.
-- Não altera os links existentes; pode ser executado novamente.
begin;
create table if not exists public.portal_analytics_config (
  id boolean primary key default true check(id),
  started_at timestamptz not null default now()
);
insert into public.portal_analytics_config(id) values(true) on conflict do nothing;
create table if not exists public.portal_analytics_events (
  event_id uuid primary key,
  visitor_id uuid not null,
  session_id uuid not null,
  kind text not null check(kind in ('visit','click','impression')),
  link_id bigint,
  title text,
  category text,
  action text not null check(action in ('site','whatsapp')),
  device text not null check(device in ('mobile','desktop')),
  created_at timestamptz not null default now()
);
create index if not exists portal_analytics_date on public.portal_analytics_events(created_at);
create index if not exists portal_analytics_session_date on public.portal_analytics_events(session_id,created_at);
create unique index if not exists portal_analytics_visit_once on public.portal_analytics_events(session_id) where kind='visit';
create unique index if not exists portal_analytics_impression_once on public.portal_analytics_events(session_id,link_id) where kind='impression';
alter table public.portal_analytics_events enable row level security;
alter table public.portal_analytics_config enable row level security;
revoke all on public.portal_analytics_events, public.portal_analytics_config from public, anon, authenticated;

create or replace function public.portal_record_event(p_event_id uuid, p_visitor_id uuid, p_session_id uuid, p_kind text, p_link_id bigint, p_action text, p_device text)
returns boolean language plpgsql security definer set search_path='' as $$
declare entry_title text; entry_category text;
begin
  if p_event_id is null or p_visitor_id is null or p_session_id is null or p_kind is null or p_kind not in ('visit','click','impression') or p_action is null or p_action not in ('site','whatsapp') or p_device is null or p_device not in ('mobile','desktop') then return false; end if;
  -- Serializes each session, including parallel retries, before checking limits.
  perform pg_advisory_xact_lock(hashtextextended(p_session_id::text,0));
  if (select count(*) from public.portal_analytics_events where session_id=p_session_id and created_at>now()-interval '1 minute') >= 60 then return false; end if;
  if exists(select 1 from public.portal_analytics_events where session_id=p_session_id and visitor_id<>p_visitor_id) then return false; end if;
  if p_kind='visit' then
    if p_link_id is not null or p_action<>'site' then return false; end if;
  else
    select titulo,categoria into entry_title,entry_category from public.atalhos_links where id=p_link_id;
    if not found then return false; end if;
    if p_kind='impression' and (entry_category<>'Propaganda' or p_action<>'site') then return false; end if;
  end if;
  insert into public.portal_analytics_events(event_id,visitor_id,session_id,kind,link_id,title,category,action,device)
  values(p_event_id,p_visitor_id,p_session_id,p_kind,p_link_id,case when p_kind='visit' then null else entry_title end,case when p_kind='visit' then null else entry_category end,p_action,p_device)
  on conflict do nothing;
  return found;
end $$;
revoke all on function public.portal_record_event(uuid,uuid,uuid,text,bigint,text,text) from public;
grant execute on function public.portal_record_event(uuid,uuid,uuid,text,bigint,text,text) to anon,authenticated;

create or replace function public.portal_analytics_report(p_month date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; start_at timestamptz; end_at timestamptz;
begin
  if not public.is_portal_admin() then raise exception 'Acesso exclusivo dos administradores.' using errcode='42501'; end if;
  if p_month is null or p_month < date '2020-01-01' or p_month > (now() at time zone 'America/Cuiaba')::date then raise exception 'Mês inválido.'; end if;
  start_at := date_trunc('month',p_month::timestamp) at time zone 'America/Cuiaba';
  end_at := (date_trunc('month',p_month::timestamp)+interval '1 month') at time zone 'America/Cuiaba';
  with period as (
    select * from public.portal_analytics_events where created_at>=start_at and created_at<end_at
  ), summary as (
    select count(*) filter(where kind='visit') as visits,
      count(distinct visitor_id) filter(where kind='visit') as visitors,
      count(*) filter(where kind='click') as clicks,
      count(*) filter(where kind='click' and category='Propaganda') as partner_clicks,
      count(*) filter(where kind='impression') as impressions,
      count(*) filter(where kind='visit' and device='mobile') as mobile_visits
    from period
  ), days as (
    select d::date as day from generate_series(date_trunc('month',p_month::timestamp),date_trunc('month',p_month::timestamp)+interval '1 month'-interval '1 day',interval '1 day') d
  ), daily as (
    select to_char(d.day,'YYYY-MM-DD') as day, count(p.event_id) filter(where p.kind='visit') as visits,
      count(p.event_id) filter(where p.kind='click') as clicks
    from days d left join period p on (p.created_at at time zone 'America/Cuiaba')::date=d.day group by d.day order by d.day
  ), ranks as (
    select p.link_id, coalesce(l.titulo,max(p.title),'Atalho excluído') as title,
      coalesce(l.categoria,max(p.category),'Categoria excluída') as category,
      count(*) filter(where p.kind='click') as clicks,
      count(*) filter(where p.kind='click' and p.action='whatsapp') as whatsapp_clicks,
      count(*) filter(where p.kind='impression') as impressions,
      bool_or(p.category='Propaganda') as partner
    from period p left join public.atalhos_links l on l.id=p.link_id
    where p.kind<>'visit' group by p.link_id,l.titulo,l.categoria
  ), all_ranks as (
    select * from ranks
    union all
    select l.id,l.titulo,l.categoria,0::bigint,0::bigint,0::bigint,true
    from public.atalhos_links l where l.categoria='Propaganda' and not exists(select 1 from ranks r where r.link_id=l.id)
  ), months as (
    select m as month from generate_series(date_trunc('month',p_month::timestamp)-interval '11 months',date_trunc('month',p_month::timestamp),interval '1 month') m
  ), monthly as (
    select to_char(m.month,'YYYY-MM') as month,
      count(e.event_id) filter(where e.kind='visit') as visits,
      count(e.event_id) filter(where e.kind='click') as clicks,
      count(e.event_id) filter(where e.kind='click' and e.category='Propaganda') as partner_clicks
    from months m left join public.portal_analytics_events e on e.created_at>=(m.month at time zone 'America/Cuiaba') and e.created_at<((m.month+interval '1 month') at time zone 'America/Cuiaba')
    group by m.month order by m.month
  )
  select jsonb_build_object('month',to_char(p_month,'YYYY-MM'),'started_at',(select started_at from public.portal_analytics_config where id=true),
    'summary',(select to_jsonb(s) from summary s),'daily',(select coalesce(jsonb_agg(d),'[]'::jsonb) from daily d),
    'links',(select coalesce(jsonb_agg(r order by r.clicks desc,r.impressions desc,r.title),'[]'::jsonb) from all_ranks r),
    'monthly',(select jsonb_agg(m) from monthly m)) into result;
  return result;
end $$;
revoke all on function public.portal_analytics_report(date) from public,anon;
grant execute on function public.portal_analytics_report(date) to authenticated;
commit;
select 'Monitoramento ativado. O histórico começa agora.' as resultado;
