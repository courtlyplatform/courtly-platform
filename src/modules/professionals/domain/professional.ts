import type { OrganizationRole } from '@/shared/auth/get-current-organization-commercial-context';
import type { PermissionCode } from '@/shared/auth/permissions';

export type ProfessionalAccessStatus = 'NO_ACCESS' | 'INVITED' | 'ACTIVE' | 'SUSPENDED';
export type ProfessionalRegistration = { id: string; authority: string; registrationNumber: string; region: string | null };
export type ProfessionalSpecialty = { id: string; name: string; active: boolean };
export type ProfessionalAvailabilityRule = { id: string; weekday: number; startTime: string; endTime: string; active: boolean };
export type ProfessionalUnavailability = { id: string; startsAt: string; endsAt: string; reason: string | null };

export type Professional = {
  id: string; organizationId: string; userId: string | null;
  firstName: string; lastName: string; preferredName: string | null; fullName: string;
  jobTitle: string | null; email: string | null; phone: string | null; countryCode: string | null;
  birthDate: string | null; documentType: string | null; documentNumber: string | null;
  avatarPath: string | null; avatarUrl: string | null; notes: string | null;
  active: boolean; accessStatus: ProfessionalAccessStatus; role: OrganizationRole | null;
  specialties: ProfessionalSpecialty[]; registrations: ProfessionalRegistration[]; activityIds: string[];
  permissions: PermissionCode[]; availabilityRules: ProfessionalAvailabilityRule[]; unavailability: ProfessionalUnavailability[];
};

export type ProfessionalListFilters = { search?: string; status?: 'ACTIVE'|'INACTIVE'|''; specialtyId?: string; documentType?: string; documentNumber?: string; registrationAuthority?: string; registrationNumber?: string };
export type ProfessionalPageData = { professionals: Professional[]; specialties: ProfessionalSpecialty[]; activities: {id:string;name:string;active:boolean}[]; canCreate:boolean; canEdit:boolean; canDisable:boolean; canManageAccess:boolean };
