-- Additive pagination. Invoker privileges preserve every existing table RLS policy.
create or replace function public.courtly_search_text(value text) returns text
language sql immutable parallel safe set search_path = public
as $$ select lower(translate(trim(coalesce(value,'')),
 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ',
 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')) $$;

create or replace function public.courtly_page_ids(
 p_organization_id uuid, p_module text, p_filters jsonb default '{}'::jsonb,
 p_page integer default 1, p_page_size integer default 10
) returns jsonb language plpgsql stable security invoker set search_path = public
as $fn$
declare
 source_sql text; where_sql text; order_sql text; permission_code text;
 aggregate_sql text := 'count(*) n, 0::numeric billed, 0::numeric received, 0::numeric receivable, 0::numeric overdue';
 page_size integer := case when p_page_size in (10,20,50,100) then p_page_size else 10 end;
 result jsonb;
begin
 if auth.uid() is null or not public.is_organization_member(p_organization_id) then
  raise exception 'FORBIDDEN' using errcode='42501';
 end if;
 case p_module
 when 'customers' then
 source_sql := 'public.customers t';
 where_sql := 't.organization_id = $1 and (coalesce($2->>''name'','''') = '''' or strpos(public.courtly_search_text(t.name), public.courtly_search_text(coalesce($2->>''name'',''''))) > 0) and (coalesce($2->>''documentType'','''') = '''' or t.document_type::text = coalesce($2->>''documentType'','''')) and (regexp_replace(coalesce($2->>''documentNumber'',''''), ''[^0-9]'', '''', ''g'') = '''' or strpos(regexp_replace(coalesce(t.document_number,''''), ''[^0-9]'', '''', ''g''), regexp_replace(coalesce($2->>''documentNumber'',''''), ''[^0-9]'', '''', ''g'')) > 0) and (coalesce($2->>''status'','''') = '''' or t.active = (lower(coalesce($2->>''status'','''')) = ''active''))';
 order_sql := 't.name, t.id'; permission_code := 'CUSTOMERS_VIEW';
 when 'services' then
 source_sql := 'public.activities t';
 where_sql := 't.organization_id = $1 and (coalesce($2->>''status'','''') = '''' or t.active = (lower(coalesce($2->>''status'','''')) = ''active'')) and (coalesce($2->>''duration'','''') = '''' or t.default_duration_minutes::text = coalesce($2->>''duration'','''')) and (coalesce($2->>''minPrice'','''') = '''' or t.default_price >= nullif(coalesce($2->>''minPrice'',''''),'''')::numeric) and (coalesce($2->>''maxPrice'','''') = '''' or t.default_price <= nullif(coalesce($2->>''maxPrice'',''''),'''')::numeric) and (coalesce($2->>''search'','''')='''' or case when exists(select 1 from public.activities e where e.organization_id=$1 and public.courtly_search_text(e.name)=public.courtly_search_text(coalesce($2->>''search'',''''))) then public.courtly_search_text(t.name)=public.courtly_search_text(coalesce($2->>''search'','''')) else strpos(public.courtly_search_text(concat_ws('' '',t.name,t.description)),public.courtly_search_text(coalesce($2->>''search'','''')))>0 end)';
 order_sql := 't.active desc, t.name, t.id'; permission_code := 'SERVICES_VIEW';
 when 'professionals' then
 source_sql := 'public.professionals t';
 where_sql := 't.organization_id = $1 and (coalesce($2->>''status'','''') = '''' or t.active = (lower(coalesce($2->>''status'','''')) = ''active'')) and (coalesce($2->>''docType'','''') = '''' or t.document_type::text = coalesce($2->>''docType'','''')) and (regexp_replace(coalesce($2->>''docNumber'',''''), ''[^0-9]'', '''', ''g'') = '''' or strpos(regexp_replace(coalesce(t.document_number,''''), ''[^0-9]'', '''', ''g''), regexp_replace(coalesce($2->>''docNumber'',''''), ''[^0-9]'', '''', ''g'')) > 0) and (coalesce($2->>''search'','''') = '''' or strpos(public.courtly_search_text(concat_ws('' '',t.first_name,t.last_name,t.preferred_name,t.document_number,(select string_agg(concat_ws('' '',r.authority,r.registration_number),'' '') from public.professional_registrations r where r.organization_id=$1 and r.professional_id=t.id))), public.courtly_search_text(coalesce($2->>''search'',''''))) > 0) and (coalesce($2->>''specialty'','''')='''' or exists(select 1 from public.professional_specialty_assignments a where a.organization_id=$1 and a.professional_id=t.id and a.specialty_id::text=coalesce($2->>''specialty'',''''))) and (coalesce($2->>''regAuthority'','''')='''' or exists(select 1 from public.professional_registrations r where r.organization_id=$1 and r.professional_id=t.id and (coalesce($2->>''regAuthority'','''') = '''' or r.authority::text = coalesce($2->>''regAuthority'','''')))) and (coalesce($2->>''regNumber'','''')='''' or exists(select 1 from public.professional_registrations r where r.organization_id=$1 and r.professional_id=t.id and (coalesce($2->>''regNumber'','''') = '''' or strpos(public.courtly_search_text(r.registration_number), public.courtly_search_text(coalesce($2->>''regNumber'',''''))) > 0)))';
 order_sql := 't.first_name, t.id'; permission_code := 'PROFESSIONALS_VIEW';
 when 'specialties' then
 source_sql := 'public.professional_specialties t';
 where_sql := 't.organization_id = $1 and (coalesce($2->>''status'','''') = '''' or t.active = (lower(coalesce($2->>''status'','''')) = ''active'')) and (coalesce($2->>''area'','''') = '''' or t.area::text = coalesce($2->>''area'','''')) and (coalesce($2->>''search'','''')='''' or case when exists(select 1 from public.professional_specialties e where e.organization_id=$1 and (coalesce($2->>''area'','''')='''' or e.area::text=coalesce($2->>''area'','''')) and (coalesce($2->>''status'','''')='''' or e.active=(lower(coalesce($2->>''status'',''''))=''active'')) and public.courtly_search_text(e.name)=public.courtly_search_text(coalesce($2->>''search'',''''))) then public.courtly_search_text(t.name)=public.courtly_search_text(coalesce($2->>''search'','''')) else strpos(public.courtly_search_text(t.name),public.courtly_search_text(coalesce($2->>''search'','''')))>0 end)';
 order_sql := 't.name, t.id'; permission_code := 'PROFESSIONALS_VIEW';
 when 'exceptions' then
 source_sql := 'public.professional_schedule_exceptions t';
 where_sql := 't.organization_id = $1 and t.professional_id::text=coalesce($2->>''professionalId'','''')';
 order_sql := 't.starts_at desc, t.id'; permission_code := 'PROFESSIONALS_VIEW';
 when 'rules' then
 source_sql := 'public.schedule_rules t';
 where_sql := 't.organization_id = $1';
 order_sql := 't.effective_from desc, t.weekday, t.start_time, t.id'; permission_code := 'SCHEDULING_VIEW_ALL';
 when 'attendance' then
 source_sql := 'public.appointments t left join public.customers c on c.id=t.customer_id and c.organization_id=t.organization_id left join public.activities a on a.id=t.activity_id and a.organization_id=t.organization_id left join public.professional_specialties s on s.id=a.specialty_id and s.organization_id=t.organization_id left join public.professionals p on p.id=t.professional_id and p.organization_id=t.organization_id';
 where_sql := 't.organization_id = $1 and (coalesce($2->>''status'','''') in ('''',''ALL'') or coalesce(t.attendance_status::text,case when t.status::text=''CANCELLED'' then ''CANCELLED'' else ''PENDING'' end)=coalesce($2->>''status'','''')) and (coalesce($2->>''search'','''') = '''' or strpos(public.courtly_search_text(concat_ws('' '',c.name,c.document_type,c.document_number,c.email,c.phone,a.name,s.name,p.name)), public.courtly_search_text(coalesce($2->>''search'',''''))) > 0) and (coalesce($2->>''start'','''')='''' or t.starts_at >= nullif(coalesce($2->>''start'',''''),'''')::timestamptz) and (coalesce($2->>''end'','''')='''' or t.starts_at < nullif(coalesce($2->>''end'',''''),'''')::timestamptz + interval ''1 day'')';
 order_sql := 't.starts_at desc, t.id'; permission_code := 'ATTENDANCE_VIEW';
 when 'revenues' then
 source_sql := 'public.financial_revenues t left join public.customers c on c.id=t.customer_id and c.organization_id=t.organization_id left join public.activities a on a.id=t.activity_id and a.organization_id=t.organization_id';
 where_sql := 't.organization_id = $1 and t.reference_date between nullif(coalesce($2->>''start'',''''),'''')::date and nullif(coalesce($2->>''end'',''''),'''')::date and (coalesce($2->>''documentType'','''') = '''' or c.document_type::text = coalesce($2->>''documentType'','''')) and (coalesce($2->>''status'','''') = '''' or t.status::text = coalesce($2->>''status'','''')) and (coalesce($2->>''dueDate'','''') = '''' or t.due_date::text = coalesce($2->>''dueDate'','''')) and (coalesce($2->>''service'','''') = '''' or strpos(public.courtly_search_text(a.name), public.courtly_search_text(coalesce($2->>''service'',''''))) > 0) and (coalesce($2->>''customer'','''')='''' or strpos(public.courtly_search_text(c.name), public.courtly_search_text(coalesce($2->>''customer'','''')))>0 or (regexp_replace(coalesce($2->>''customer'',''''),''[^0-9]'','''',''g'')<>'''' and strpos(regexp_replace(coalesce(c.document_number,''''),''[^0-9]'','''',''g''),regexp_replace(coalesce($2->>''customer'',''''),''[^0-9]'','''',''g''))>0))';
 order_sql := 't.reference_date desc, t.created_at desc, t.id'; permission_code := 'FINANCIAL_VIEW';
 else raise exception 'INVALID_MODULE'; end case;
 if not public.user_has_permission(p_organization_id,permission_code) and
    not (p_module='rules' and public.user_has_permission(p_organization_id,'SCHEDULING_VIEW_OWN')) then
  raise exception 'FORBIDDEN' using errcode='42501';
 end if;
 if p_module='revenues' then
  aggregate_sql := $$count(*) n,
   coalesce(sum(t.amount) filter(where t.status::text <> 'CANCELLED' and t.currency_code::text=$2->>'currency'),0) billed,
   coalesce(sum(t.amount) filter(where t.status::text = 'PAID' and t.currency_code::text=$2->>'currency'),0) received,
   coalesce(sum(t.amount) filter(where t.status::text in ('PENDING','OVERDUE') and t.currency_code::text=$2->>'currency'),0) receivable,
   coalesce(sum(t.amount) filter(where t.status::text = 'OVERDUE' and t.currency_code::text=$2->>'currency'),0) overdue$$;
  order_sql := case p_filters->>'sort'
   when 'amount-desc' then 't.amount desc, t.id'
   when 'reference-asc' then 't.reference_date, t.id'
   when 'status' then $$case t.status::text when 'OVERDUE' then 0 when 'PENDING' then 1 when 'PAID' then 2 else 3 end, t.due_date, t.id$$
   else order_sql end;
 end if;
 -- Count and clamped page use one statement/snapshot. Only UUIDs of the requested page leave PostgreSQL.
 execute format($q$
 with totals as (select %4$s from %1$s where %2$s),
 meta as (select totals.*, greatest(1,ceil(n::numeric/$3)::integer) pages,
 least(greatest(1,$4),greatest(1,ceil(n::numeric/$3)::integer)) page from totals),
 selected as (select t.id, row_number() over(order by %3$s) ordinal from %1$s where %2$s
 order by %3$s limit $3 offset (select (page::bigint-1)*$3 from meta))
 select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by ordinal) from selected),'[]'::jsonb),
 'total',n,'totalPages',pages,'page',page,'pageSize',$3,
 'revenueTotals',jsonb_build_object('billedRevenue',billed,'receivedRevenue',received,'receivableRevenue',receivable,'overdueRevenue',overdue)) from meta
 $q$,source_sql,where_sql,order_sql,aggregate_sql)
 into result using p_organization_id, coalesce(p_filters,'{}'::jsonb),page_size,coalesce(p_page,1);
 return result;
end $fn$;
revoke all on function public.courtly_page_ids(uuid,text,jsonb,integer,integer) from public, anon;
grant execute on function public.courtly_page_ids(uuid,text,jsonb,integer,integer) to authenticated;

create or replace function public.courtly_revenue_totals(p_organization_id uuid,p_start date,p_end date)
returns table(reference_date date,status public.financial_entry_status,currency_code text,amount numeric)
language sql stable security invoker set search_path=public as $$
 select date_trunc('month',r.reference_date)::date,r.status,r.currency_code::text,sum(r.amount)
 from public.financial_revenues r
 where r.organization_id=p_organization_id and auth.uid() is not null
 and public.user_has_permission(p_organization_id,'FINANCIAL_VIEW')
 and r.reference_date between p_start and p_end
 group by 1,2,3
$$;
create or replace function public.courtly_mrr(p_organization_id uuid,p_currency text)
returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('mrr',coalesce(sum(case s.billing_cycle::text
 when 'WEEKLY' then s.amount*52/12 when 'MONTHLY' then s.amount
 when 'QUARTERLY' then s.amount/3 when 'SEMIANNUAL' then s.amount/6 when 'ANNUAL' then s.amount/12 else 0 end),0),
 'activeSubscriptions',count(*),'activeCustomers',count(distinct s.customer_id))
 from public.customer_subscriptions s where s.organization_id=p_organization_id
 and s.status::text='ACTIVE' and s.currency_code::text=p_currency
 and public.user_has_permission(p_organization_id,'FINANCIAL_VIEW')
$$;
revoke all on function public.courtly_revenue_totals(uuid,date,date),public.courtly_mrr(uuid,text) from public,anon;
grant execute on function public.courtly_revenue_totals(uuid,date,date),public.courtly_mrr(uuid,text) to authenticated;

create or replace function public.courtly_service_durations(p_organization_id uuid)
returns jsonb language sql stable security invoker set search_path=public as $$
 select coalesce(jsonb_agg(duration order by duration),'[]'::jsonb) from
 (select distinct default_duration_minutes duration from public.activities
 where organization_id=p_organization_id and public.user_has_permission(p_organization_id,'SERVICES_VIEW')) d
$$;
create or replace function public.courtly_professional_options(p_organization_id uuid)
returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('total',count(*),'active',count(*) filter(where active),
 'inactive',count(*) filter(where not active),'authorities',
 (select coalesce(jsonb_agg(authority order by authority),'[]'::jsonb) from
 (select distinct authority from public.professional_registrations where organization_id=p_organization_id) r))
 from public.professionals where organization_id=p_organization_id
 and public.user_has_permission(p_organization_id,'PROFESSIONALS_VIEW')
$$;
revoke all on function public.courtly_service_durations(uuid),public.courtly_professional_options(uuid) from public,anon;
grant execute on function public.courtly_service_durations(uuid),public.courtly_professional_options(uuid) to authenticated;
-- Existing exception index covers only active entries. History must cover inactive entries too.
create index if not exists idx_courtly_exception_history_page on public.professional_schedule_exceptions
 (organization_id,professional_id,starts_at desc,id);
-- Existing professional index is organization-only, and recurrence indexes order by status.
create index if not exists idx_courtly_professionals_page on public.professionals(organization_id,first_name,id);
create index if not exists idx_courtly_rules_page on public.schedule_rules(organization_id,effective_from desc,weekday,start_time,id);
-- Exact accented-name lookup precedes partial search globally.
create index if not exists idx_courtly_service_exact_search on public.activities(organization_id,public.courtly_search_text(name));
create index if not exists idx_courtly_specialty_exact_search on public.professional_specialties(organization_id,public.courtly_search_text(name));
