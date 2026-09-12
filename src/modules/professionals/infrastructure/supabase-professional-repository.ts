import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Professional,
  ProfessionalPageData,
} from "../domain/professional";

import type {
  ProfessionalRepository,
} from "../domain/professional-repository";

type SpecialtyRow = {
  id: string;
  name: string;
  active: boolean;
};

type MembershipRow = {
  id: string;
  user_id: string;
  role: string;
};

type PermissionOverrideRow = {
  membership_id: string;
  permission_code: string;
  allowed: boolean;
};

export class SupabaseProfessionalRepository
  implements ProfessionalRepository
{
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  async getPageData(
    organizationId: string
  ): Promise<ProfessionalPageData> {
    const db = this.supabase as any;

    const [
      professionalsResult,
      specialtiesResult,
      assignmentsResult,
      registrationsResult,
      activitiesResult,
      qualificationsResult,
      membershipsResult,
      overridesResult,
      rolePermissionsResult,
      availabilityResult,
      unavailabilityResult,
      permissionsResult,
    ] = await Promise.all([
      db
        .from("professionals")
        .select(
          "id,organization_id,user_id,name,first_name,last_name,preferred_name,job_title,email,phone,birth_date,country_code,document_type,document_number,avatar_path,notes,active,access_status"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "first_name"
        ),

      db
        .from(
          "professional_specialties"
        )
        .select(
          "id,name,active"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "name"
        ),

      db
        .from(
          "professional_specialty_assignments"
        )
        .select(
          "professional_id,specialty_id"
        )
        .eq(
          "organization_id",
          organizationId
        ),

      db
        .from(
          "professional_registrations"
        )
        .select(
          "id,professional_id,authority,registration_number,region"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "authority"
        ),

      db
        .from(
          "activities"
        )
        .select(
          "id,name,active"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "name"
        ),

      db
        .from(
          "professional_activities"
        )
        .select(
          "professional_id,activity_id"
        )
        .eq(
          "organization_id",
          organizationId
        ),

      db
        .from(
          "memberships"
        )
        .select(
          "id,user_id,role"
        )
        .eq(
          "organization_id",
          organizationId
        ),

      db
        .from(
          "membership_permission_overrides"
        )
        .select(
          "membership_id,permission_code,allowed"
        ),

      db
        .from(
          "role_permissions"
        )
        .select(
          "role,permission_code,allowed"
        ),

      db
        .from(
          "professional_availability_rules"
        )
        .select(
          "id,professional_id,weekday,start_time,end_time,active"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "weekday"
        ),

      db
        .from(
          "professional_unavailability"
        )
        .select(
          "id,professional_id,starts_at,ends_at,reason"
        )
        .eq(
          "organization_id",
          organizationId
        )
        .gte(
          "ends_at",
          new Date().toISOString()
        )
        .order(
          "starts_at"
        ),

      db.rpc(
        "get_my_permissions"
      ),
    ]);

    const failure = [
      professionalsResult,
      specialtiesResult,
      assignmentsResult,
      registrationsResult,
      activitiesResult,
      qualificationsResult,
      membershipsResult,
      overridesResult,
      rolePermissionsResult,
      availabilityResult,
      unavailabilityResult,
      permissionsResult,
    ].find(
      (result: any) =>
        result.error
    );

    if (
      failure?.error
    ) {
      throw failure.error;
    }

    const specialtyById =
      new Map<
        string,
        SpecialtyRow
      >(
        (
          specialtiesResult.data ??
          []
        ).map(
          (
            specialty:
              SpecialtyRow
          ) => [
            specialty.id,
            specialty,
          ]
        )
      );

    const membershipByUser =
      new Map<
        string,
        MembershipRow
      >(
        (
          membershipsResult.data ??
          []
        ).map(
          (
            membership:
              MembershipRow
          ) => [
            membership.user_id,
            membership,
          ]
        )
      );

    const overridesByMembership =
      new Map<
        string,
        PermissionOverrideRow[]
      >();

    for (
      const row of
        (
          overridesResult.data ??
          []
        ) as PermissionOverrideRow[]
    ) {
      const existing =
        overridesByMembership.get(
          row.membership_id
        ) ?? [];

      existing.push(
        row
      );

      overridesByMembership.set(
        row.membership_id,
        existing
      );
    }

    const professionals:
      Professional[] = (
      professionalsResult.data ??
      []
    ).map(
      (row: any) => {
        const membership:
          MembershipRow | null =
          row.user_id
            ? membershipByUser.get(
                row.user_id
              ) ?? null
            : null;

        const avatarUrl =
          row.avatar_path
            ? this.supabase.storage
                .from(
                  "avatars"
                )
                .getPublicUrl(
                  row.avatar_path
                )
                .data.publicUrl
            : null;

        const specialties:
          SpecialtyRow[] = (
          assignmentsResult.data ??
          []
        )
          .filter(
            (
              assignment: any
            ) =>
              assignment
                .professional_id ===
              row.id
          )
          .map(
            (
              assignment: any
            ):
              | SpecialtyRow
              | undefined =>
              specialtyById.get(
                assignment.specialty_id
              )
          )
          .filter(
            (
              specialty:
                | SpecialtyRow
                | undefined
            ):
              specialty is SpecialtyRow =>
              specialty !==
              undefined
          );

        const permissions =
          membership
            ? (() => {
                const base =
                  new Map<
                    string,
                    boolean
                  >(
                    (
                      rolePermissionsResult.data ??
                      []
                    )
                      .filter(
                        (
                          permission: any
                        ) =>
                          permission.role ===
                          membership.role
                      )
                      .map(
                        (
                          permission: any
                        ) => [
                          permission
                            .permission_code,
                          Boolean(
                            permission
                              .allowed
                          ),
                        ]
                      )
                  );

                const overrides =
                  overridesByMembership.get(
                    membership.id
                  ) ?? [];

                for (
                  const override of
                    overrides
                ) {
                  base.set(
                    override
                      .permission_code,
                    Boolean(
                      override.allowed
                    )
                  );
                }

                return Array.from(
                  base.entries()
                )
                  .filter(
                    (
                      [
                        ,
                        allowed,
                      ]
                    ) =>
                      allowed
                  )
                  .map(
                    ([code]) =>
                      code as Professional["permissions"][number]
                  );
              })()
            : [];

        return {
          id:
            row.id,

          organizationId:
            row.organization_id,

          userId:
            row.user_id,

          firstName:
            row.first_name ??
            row.name,

          lastName:
            row.last_name ??
            "",

          preferredName:
            row.preferred_name,

          fullName: [
            row.first_name ??
              row.name,
            row.last_name,
          ]
            .filter(
              Boolean
            )
            .join(
              " "
            )
            .trim(),

          jobTitle:
            row.job_title,

          email:
            row.email,

          phone:
            row.phone,

          countryCode:
            row.country_code,

          birthDate:
            row.birth_date,

          documentType:
            row.document_type,

          documentNumber:
            row.document_number,

          avatarPath:
            row.avatar_path,

          avatarUrl,

          notes:
            row.notes,

          active:
            row.active,

          accessStatus:
            row.access_status,

          role:
            membership?.role ??
            null,

          specialties,

          registrations:
            (
              registrationsResult.data ??
              []
            )
              .filter(
                (
                  item: any
                ) =>
                  item
                    .professional_id ===
                  row.id
              )
              .map(
                (
                  item: any
                ) => ({
                  id:
                    item.id,

                  authority:
                    item.authority,

                  registrationNumber:
                    item
                      .registration_number,

                  region:
                    item.region,
                })
              ),

          activityIds:
            (
              qualificationsResult.data ??
              []
            )
              .filter(
                (
                  item: any
                ) =>
                  item
                    .professional_id ===
                  row.id
              )
              .map(
                (
                  item: any
                ) =>
                  item.activity_id
              ),

          permissions,

          availabilityRules:
            (
              availabilityResult.data ??
              []
            )
              .filter(
                (
                  item: any
                ) =>
                  item
                    .professional_id ===
                  row.id
              )
              .map(
                (
                  item: any
                ) => ({
                  id:
                    item.id,

                  weekday:
                    item.weekday,

                  startTime:
                    item.start_time,

                  endTime:
                    item.end_time,

                  active:
                    item.active,
                })
              ),

          unavailability:
            (
              unavailabilityResult.data ??
              []
            )
              .filter(
                (
                  item: any
                ) =>
                  item
                    .professional_id ===
                  row.id
              )
              .map(
                (
                  item: any
                ) => ({
                  id:
                    item.id,

                  startsAt:
                    item.starts_at,

                  endsAt:
                    item.ends_at,

                  reason:
                    item.reason,
                })
              ),
        };
      }
    );

    const ownPermissions =
      new Set<string>(
        (
          permissionsResult.data ??
          []
        )
          .filter(
            (
              permission: any
            ) =>
              permission.allowed
          )
          .map(
            (
              permission: any
            ) =>
              permission
                .permission_code
          )
      );

    return {
      professionals,

      specialties:
        (
          specialtiesResult.data ??
          []
        ).map(
          (
            specialty:
              SpecialtyRow
          ) => ({
            id:
              specialty.id,

            name:
              specialty.name,

            active:
              specialty.active,
          })
        ),

      activities:
        activitiesResult.data ??
        [],

      canCreate:
        ownPermissions.has(
          "PROFESSIONALS_CREATE"
        ),

      canEdit:
        ownPermissions.has(
          "PROFESSIONALS_EDIT"
        ),

      canDisable:
        ownPermissions.has(
          "PROFESSIONALS_DISABLE"
        ),

      canManageAccess:
        ownPermissions.has(
          "PROFESSIONALS_MANAGE_ACCESS"
        ),
    };
  }
}