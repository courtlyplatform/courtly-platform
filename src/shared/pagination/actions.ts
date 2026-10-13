"use server";
import { createClient } from "@/shared/database/supabase/server";
import { getCurrentAccessContext, can, type PermissionCode } from "@/shared/auth/permissions";
import { getCustomers } from "@/modules/customers/queries";
import { SupabaseActivityRepository } from "@/modules/activities/infrastructure/supabase-activity-repository";
import { SupabaseProfessionalRepository } from "@/modules/professionals/infrastructure/supabase-professional-repository";
import { SupabaseFinancialRepository } from "@/modules/financial/infrastructure/supabase-financial-repository";
import { normalizePagination, type Filters, type ListModule, type ModuleItems, type PaginatedResult, type PaginationParams } from "./contracts";
const permissions: Record<ListModule, PermissionCode> = {
 customers: 'CUSTOMERS_VIEW', services: 'SERVICES_VIEW', professionals: 'PROFESSIONALS_VIEW',
 specialties: 'PROFESSIONALS_VIEW', exceptions: 'PROFESSIONALS_VIEW', rules: 'SCHEDULING_VIEW_ALL',
 attendance: 'ATTENDANCE_VIEW', revenues: 'FINANCIAL_VIEW',
};
export async function loadListPage<M extends ListModule>(module: M, input: PaginationParams, filters: Filters): Promise<PaginatedResult<ModuleItems[M]>> {
 const supabase = await createClient();
 const access = await getCurrentAccessContext(supabase);
 if (!Object.prototype.hasOwnProperty.call(permissions,module) || (!can(access, permissions[module]) && !(module === 'rules' && can(access,'SCHEDULING_VIEW_OWN')))) throw new Error('FORBIDDEN');
 const cleanFilters: Filters = {};
 for (const [key,value] of Object.entries(filters ?? {})) {
  if (typeof value === 'string') cleanFilters[key] = value.slice(0,500);
 }
 const params = normalizePagination(input);
 const {data, error} = await supabase.rpc('courtly_page_ids', {
  p_organization_id: access.organizationId, p_module: module, p_filters: cleanFilters,
  p_page: params.page, p_page_size: params.pageSize,
 });
 if (error) throw new Error(error.message);
 const meta = data as unknown as { ids: string[]; total: number; totalPages: number; page: number; pageSize: PaginationParams['pageSize']; revenueTotals: import("./contracts").RevenueTotals };
 let items: ModuleItems[ListModule][] = [];
 if (meta.ids.length) {
  const ids = meta.ids;
  if (module === 'customers') items = await getCustomers(ids);
  else if (module === 'services') items = await new SupabaseActivityRepository(supabase,ids).listByOrganization(access.organizationId);
  else if (module === 'professionals') items = (await new SupabaseProfessionalRepository(supabase,ids,false).getPageData(access.organizationId)).professionals;
  else if (module === 'revenues') items = await new SupabaseFinancialRepository(supabase, ids).listRevenues(access.organizationId,{start:cleanFilters.start,end:cleanFilters.end});
  else {
   if (module === 'specialties') {
    const {data:rows,error:rowError} = await supabase.from('professional_specialties').select('*,professional_specialty_assignments(count)').eq('organization_id',access.organizationId).in('id',ids);
    if(rowError) throw new Error(rowError.message);
    items=(rows??[]).map(row=>({id:row.id,name:row.name,area:row.area,color:row.color,active:row.active,professionalCount:row.professional_specialty_assignments[0]?.count??0}));
   } else if (module === 'exceptions') {
    const {data:rows,error:rowError} = await supabase.from('professional_schedule_exceptions').select('*').eq('organization_id',access.organizationId).in('id',ids);
    if(rowError) throw new Error(rowError.message);
    items=(rows??[]).map(row=>({id:row.id,exceptionType:row.exception_type,startsAt:row.starts_at,endsAt:row.ends_at,reason:row.reason,reasonDetails:row.reason_details,active:row.active,createdAt:row.created_at}));
   } else if (module === 'rules') {
    const [rules,resources,conflicts] = await Promise.all([
     supabase.from('schedule_rules').select('*').eq('organization_id',access.organizationId).in('id',ids),
     supabase.from('schedule_rule_resources').select('schedule_rule_id,resource_id').eq('organization_id',access.organizationId).in('schedule_rule_id',ids),
     supabase.from('schedule_generation_conflicts').select('id,schedule_rule_id,starts_at,ends_at,reason').eq('organization_id',access.organizationId).in('schedule_rule_id',ids).is('resolved_at',null),
    ]);
    if(rules.error || resources.error || conflicts.error) throw new Error((rules.error??resources.error??conflicts.error)!.message);
    items=(rules.data??[]).map(row=>({id:row.id,customerId:row.customer_id,customerSubscriptionId:row.customer_subscription_id,activityId:row.activity_id,professionalId:row.professional_id,weekday:row.weekday,startTime:row.start_time,endTime:row.end_time,effectiveFrom:row.effective_from,effectiveUntil:row.effective_until,status:row.status,resourceIds:(resources.data??[]).filter(r=>r.schedule_rule_id===row.id).map(r=>r.resource_id),conflicts:(conflicts.data??[]).filter(c=>c.schedule_rule_id===row.id).map(c=>({id:c.id,scheduleRuleId:c.schedule_rule_id,startsAt:c.starts_at,endsAt:c.ends_at,reason:c.reason}))}));
   } else if (module === 'attendance') {
    const {data:rows,error:rowError} = await supabase.from('appointments').select('*,customers(name,document_type,document_number,email,phone),activities(name,professional_specialties(name,color)),professionals(name)').eq('organization_id',access.organizationId).in('id',ids);
    if(rowError) throw new Error(rowError.message);
    items=(rows??[]).map<ModuleItems['attendance']>(row=>({id:row.id,customerId:row.customer_id,customerName:row.customers?.name??'',documentType:row.customers?.document_type??null,documentNumber:row.customers?.document_number??null,email:row.customers?.email??null,phone:row.customers?.phone??null,activityId:row.activity_id,activityName:row.activities?.name??'',specialtyName:row.activities?.professional_specialties?.name??null,specialtyColor:row.activities?.professional_specialties?.color??null,professionalId:row.professional_id,professionalName:row.professionals?.name??null,startsAt:row.starts_at,endsAt:row.ends_at,appointmentStatus:row.status,attendanceStatus:row.attendance_status==='CONFIRMED'?'CONFIRMED':row.attendance_status==='PENDING'?'PENDING':row.attendance_status==='CANCELLED'?'CANCELLED':row.status==='CANCELLED'?'CANCELLED':'PENDING',source:row.source,cancellationReason:row.cancellation_reason}));
   }
  }
  const byId = new Map(items.map(item=>[item.id,item]));
  items = ids.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);
 }
 return {items: items as ModuleItems[M][],total:meta.total,totalPages:meta.totalPages,page:meta.page,pageSize:meta.pageSize,revenueTotals:meta.revenueTotals};
}
