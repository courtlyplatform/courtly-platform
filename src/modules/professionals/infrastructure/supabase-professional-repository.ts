import type { SupabaseClient } from '@supabase/supabase-js';
import type { Professional, ProfessionalPageData, ProfessionalSpecialty } from '../domain/professional';
import type { ProfessionalRepository } from '../domain/professional-repository';

type SpecialtyRow = Omit<ProfessionalSpecialty, 'professionalCount'>;
type MembershipRow = { id: string; user_id: string; role: string };
type PermissionOverrideRow = { membership_id: string; permission_code: string; allowed: boolean };

export class SupabaseProfessionalRepository implements ProfessionalRepository {
  constructor(private readonly supabase: SupabaseClient, private readonly listIds?: string[], private readonly includeLookups = true) {}

  async getPageData(organizationId: string): Promise<ProfessionalPageData> {
    const db = this.supabase as any;
    const options = this.includeLookups
      ? await db.rpc('courtly_professional_options',{p_organization_id:organizationId})
      : {data:{total:0,active:0,inactive:0,authorities:[]},error:null};
    if(options.error) throw options.error;
    let ids = this.listIds;
    if (!ids) {
      const pageIds = await db.from('professionals').select('id').eq('organization_id',organizationId).order('first_name').order('id').range(0,9);
      if (pageIds.error) throw pageIds.error;
      ids = (pageIds.data ?? []).map((row: {id:string})=>row.id);
    }
    const assignmentsResult = await db.from('professional_specialty_assignments').select('professional_id,specialty_id')
      .eq('organization_id',organizationId).in('professional_id',ids);
    if(assignmentsResult.error) throw assignmentsResult.error;
    let specialtyQuery = db.from('professional_specialties').select('id,name,area,color,active,professional_specialty_assignments(count)')
      .eq('organization_id',organizationId).order('name');
    if(!this.includeLookups) specialtyQuery = specialtyQuery.in('id',(assignmentsResult.data ?? []).map((a: {specialty_id:string})=>a.specialty_id));

    const selectedUsers = await db.from('professionals').select('user_id').eq('organization_id',organizationId).in('id',ids);
    if(selectedUsers.error) throw selectedUsers.error;
    const membershipsResult = await db.from('memberships').select('id,user_id,role').eq('organization_id',organizationId)
      .in('user_id',(selectedUsers.data ?? []).flatMap((p: {user_id:string|null})=>p.user_id?[p.user_id]:[]));
    if(membershipsResult.error) throw membershipsResult.error;


    const [
      professionalsResult,
      specialtiesResult,
      registrationsResult,
      activitiesResult,
      qualificationsResult,
      overridesResult,
      rolePermissionsResult,
      availabilityResult,
      unavailabilityResult,
      scheduleExceptionsResult,
      permissionsResult,
    ] = await Promise.all([
      db.from('professionals')
        .select('id,organization_id,user_id,name,first_name,last_name,preferred_name,job_title,email,phone,birth_date,country_code,document_type,document_number,avatar_path,notes,active,access_status,professional_schedule_exceptions(count)')
        .eq('organization_id', organizationId)
        .in('id', ids).order('first_name').order('id'),
      specialtyQuery,
      db.from('professional_registrations')
        .select('id,professional_id,authority,registration_number,region')
        .eq('organization_id', organizationId).in('professional_id', ids)
        .order('authority'),
      this.includeLookups ? db.from('activities').select('id,name,active').eq('organization_id', organizationId).order('name') : Promise.resolve({data:[],error:null}),
      db.from('professional_activities').select('professional_id,activity_id').eq('organization_id', organizationId).in('professional_id', ids),
      db.from('membership_permission_overrides').select('membership_id,permission_code,allowed').in('membership_id',(membershipsResult.data ?? []).map((m: MembershipRow)=>m.id)),
      db.from('role_permissions').select('role,permission_code,allowed'),
      db.from('professional_availability_rules')
        .select('id,professional_id,weekday,start_time,end_time,active')
        .eq('organization_id', organizationId).in('professional_id', ids)
        .order('weekday')
        .order('start_time'),
      db.from('professional_unavailability')
        .select('id,professional_id,starts_at,ends_at,reason')
        .eq('organization_id', organizationId).in('professional_id', ids)
        .order('starts_at', { ascending: false }),
      db.from('professional_schedule_exceptions')
        .select('id,professional_id,exception_type,starts_at,ends_at,reason,reason_details,active,created_at')
        .eq('organization_id', organizationId).in('professional_id', ids).limit(0)
        .order('starts_at', { ascending: false }),
      db.rpc('get_my_permissions'),
    ]);

    const failure = [
      professionalsResult, specialtiesResult, assignmentsResult, registrationsResult,
      activitiesResult, qualificationsResult, membershipsResult, overridesResult,
      rolePermissionsResult, availabilityResult, unavailabilityResult, scheduleExceptionsResult, permissionsResult,
    ].find((result: any) => result.error);
    if (failure?.error) throw failure.error;

    const assignmentRows = assignmentsResult.data ?? [];
    const specialties: ProfessionalSpecialty[] = (specialtiesResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      area: row.area,
      color: row.color,
      active: row.active,
      professionalCount: row.professional_specialty_assignments?.[0]?.count ?? 0,
    }));
    const specialtyById = new Map<string, ProfessionalSpecialty>(specialties.map((s) => [s.id, s]));
    const membershipByUser = new Map<string, MembershipRow>((membershipsResult.data ?? []).map((m: MembershipRow) => [m.user_id, m]));
    const overridesByMembership = new Map<string, PermissionOverrideRow[]>();
    for (const row of (overridesResult.data ?? []) as PermissionOverrideRow[]) {
      const existing = overridesByMembership.get(row.membership_id) ?? [];
      existing.push(row);
      overridesByMembership.set(row.membership_id, existing);
    }

    const professionals: Professional[] = (professionalsResult.data ?? []).map((row: any) => {
      const membership: MembershipRow | null = row.user_id ? membershipByUser.get(row.user_id) ?? null : null;
      const avatarUrl = row.avatar_path
        ? this.supabase.storage.from('avatars').getPublicUrl(row.avatar_path).data.publicUrl
        : null;
      const professionalSpecialties = assignmentRows
        .filter((a: any) => a.professional_id === row.id)
        .map((a: any) => specialtyById.get(a.specialty_id))
        .filter((s: ProfessionalSpecialty | undefined): s is ProfessionalSpecialty => Boolean(s));

      const permissions = membership ? (() => {
        const base = new Map<string, boolean>(
          (rolePermissionsResult.data ?? [])
            .filter((p: any) => p.role === membership.role)
            .map((p: any) => [p.permission_code, Boolean(p.allowed)]),
        );
        for (const override of overridesByMembership.get(membership.id) ?? []) {
          base.set(override.permission_code, Boolean(override.allowed));
        }
        return Array.from(base.entries())
          .filter(([, allowed]) => allowed)
          .map(([code]) => code as Professional['permissions'][number]);
      })() : [];

      return {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        firstName: row.first_name ?? row.name,
        lastName: row.last_name ?? '',
        preferredName: row.preferred_name,
        fullName: [row.first_name ?? row.name, row.last_name].filter(Boolean).join(' ').trim(),
        jobTitle: row.job_title,
        email: row.email,
        phone: row.phone,
        countryCode: row.country_code,
        birthDate: row.birth_date,
        documentType: row.document_type,
        documentNumber: row.document_number,
        avatarPath: row.avatar_path,
        avatarUrl,
        notes: row.notes,
        active: row.active,
        accessStatus: row.access_status,
        role: membership?.role ?? null,
        specialties: professionalSpecialties,
        registrations: (registrationsResult.data ?? [])
          .filter((item: any) => item.professional_id === row.id)
          .map((item: any) => ({ id: item.id, authority: item.authority, registrationNumber: item.registration_number, region: item.region })),
        activityIds: (qualificationsResult.data ?? [])
          .filter((item: any) => item.professional_id === row.id)
          .map((item: any) => item.activity_id),
        permissions,
        availabilityRules: (availabilityResult.data ?? [])
          .filter((item: any) => item.professional_id === row.id)
          .map((item: any) => ({ id: item.id, weekday: item.weekday, startTime: item.start_time, endTime: item.end_time, active: item.active })),
        unavailability: (unavailabilityResult.data ?? [])
          .filter((item: any) => item.professional_id === row.id)
          .map((item: any) => ({ id: item.id, startsAt: item.starts_at, endsAt: item.ends_at, reason: item.reason })),
        scheduleExceptionCount: row.professional_schedule_exceptions?.[0]?.count ?? 0,
        scheduleExceptions: (scheduleExceptionsResult.data ?? [])
          .filter((item: any) => item.professional_id === row.id)
          .map((item: any) => ({
            id: item.id,
            exceptionType: item.exception_type,
            startsAt: item.starts_at,
            endsAt: item.ends_at,
            reason: item.reason,
            reasonDetails: item.reason_details,
            active: item.active,
            createdAt: item.created_at,
          })),
      };
    });

    const allowedPermissions = new Set(
      (permissionsResult.data ?? []).filter((p: any) => p.allowed).map((p: any) => p.permission_code),
    );

    return {
      professionals,
      counts: {total:options.data.total,active:options.data.active,inactive:options.data.inactive},
      registrationAuthorities: options.data.authorities,
      specialties,
      activities: activitiesResult.data ?? [],
      canCreate: allowedPermissions.has('PROFESSIONALS_CREATE'),
      canEdit: allowedPermissions.has('PROFESSIONALS_EDIT'),
      canDisable: allowedPermissions.has('PROFESSIONALS_DISABLE'),
      canManageAccess: allowedPermissions.has('PROFESSIONALS_MANAGE_ACCESS'),
    };
  }
}
