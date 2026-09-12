import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrganizationRole } from './get-current-organization-commercial-context';

export type PermissionCode =
  | 'DASHBOARD_VIEW' | 'CUSTOMERS_VIEW' | 'CUSTOMERS_CREATE' | 'CUSTOMERS_EDIT' | 'CUSTOMERS_DEACTIVATE'
  | 'SERVICES_VIEW' | 'SERVICES_CREATE' | 'SERVICES_EDIT' | 'SERVICES_DEACTIVATE'
  | 'PROFESSIONALS_VIEW' | 'PROFESSIONALS_CREATE' | 'PROFESSIONALS_EDIT' | 'PROFESSIONALS_DISABLE' | 'PROFESSIONALS_MANAGE_ACCESS'
  | 'SCHEDULING_VIEW_ALL' | 'SCHEDULING_VIEW_OWN' | 'SCHEDULING_CREATE' | 'SCHEDULING_EDIT' | 'SCHEDULING_CANCEL' | 'SCHEDULING_RESCHEDULE'
  | 'ATTENDANCE_VIEW' | 'ATTENDANCE_MANAGE' | 'MAKEUPS_VIEW' | 'MAKEUPS_MANAGE'
  | 'FINANCIAL_VIEW' | 'FINANCIAL_MANAGE' | 'ORGANIZATION_SETTINGS_VIEW' | 'ORGANIZATION_SETTINGS_EDIT';

export type AccessContext = { organizationId: string; membershipId: string; role: OrganizationRole; permissions: Set<PermissionCode> };

export async function getCurrentAccessContext(supabase: SupabaseClient): Promise<AccessContext> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('User is not authenticated.');
  const db = supabase as any;
  const { data: membership, error } = await db.from('memberships').select('id,organization_id,role').eq('user_id',auth.user.id).limit(1).maybeSingle();
  if (error || !membership) throw error ?? new Error('Membership not found.');
  const { data: rows, error: permissionError } = await db.rpc('get_my_permissions');
  if (permissionError) throw permissionError;
  const permissions = new Set<PermissionCode>((rows ?? []).filter((row: any) => row.allowed).map((row: any) => row.permission_code as PermissionCode));
  return { organizationId: membership.organization_id, membershipId: membership.id, role: membership.role, permissions };
}

export function can(context: AccessContext, permission: PermissionCode) {
  return context.role === 'OWNER' || context.permissions.has(permission);
}
