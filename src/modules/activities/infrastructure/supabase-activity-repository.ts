import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, CreateActivityInput, SetActivityStatusInput, UpdateActivityInput } from "../domain/activity";
import type { ActivityRepository } from "../domain/activity-repository";

type ActivityRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  default_duration_minutes: number;
  default_price: number | string | null;
  scheduling_mode: Activity["schedulingMode"];
  professional_requirement: Activity["professionalRequirement"];
  resource_requirement: Activity["resourceRequirement"];
  specialty_id: string | null;
  professional_specialties?: { name: string; color: string } | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const ACTIVITY_SELECT = `
  id, organization_id, name, description, default_duration_minutes, default_price,
  scheduling_mode, professional_requirement, resource_requirement, specialty_id,
  professional_specialties(name,color), active, created_at, updated_at
`;

export class SupabaseActivityRepository implements ActivityRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listByOrganization(organizationId: string): Promise<Activity[]> {
    const { data, error } = await this.supabase.from("activities").select(ACTIVITY_SELECT)
      .eq("organization_id", organizationId).order("active", { ascending: false }).order("name", { ascending: true });
    if (error) throw new Error(`Failed to list activities: ${error.message}`);
    return (data as unknown as ActivityRow[]).map(mapActivityToDomain);
  }

  async findById(organizationId: string, activityId: string): Promise<Activity | null> {
    const { data, error } = await this.supabase.from("activities").select(ACTIVITY_SELECT)
      .eq("organization_id", organizationId).eq("id", activityId).maybeSingle();
    if (error) throw new Error(`Failed to find activity: ${error.message}`);
    return data ? mapActivityToDomain(data as unknown as ActivityRow) : null;
  }

  async create(input: CreateActivityInput): Promise<Activity> {
    const { data, error } = await this.supabase.from("activities").insert({
      organization_id: input.organizationId,
      name: input.name,
      description: input.description ?? null,
      default_duration_minutes: input.defaultDurationMinutes,
      default_price: input.defaultPrice ?? null,
      scheduling_mode: input.schedulingMode,
      professional_requirement: input.professionalRequirement,
      resource_requirement: input.resourceRequirement,
      specialty_id: input.specialtyId ?? null,
    }).select(ACTIVITY_SELECT).single();
    if (error) throw new Error(`Failed to create activity: ${error.message}`);
    return mapActivityToDomain(data as unknown as ActivityRow);
  }

  async update(input: UpdateActivityInput): Promise<Activity> {
    const payload: Record<string, unknown> = {
      name: input.name,
      description: input.description ?? null,
      default_duration_minutes: input.defaultDurationMinutes,
      default_price: input.defaultPrice ?? null,
      scheduling_mode: input.schedulingMode,
      professional_requirement: input.professionalRequirement,
      resource_requirement: input.resourceRequirement,
    };
    if (input.specialtyId !== undefined) payload.specialty_id = input.specialtyId;
    const { data, error } = await this.supabase.from("activities").update(payload).eq("organization_id", input.organizationId).eq("id", input.id).select(ACTIVITY_SELECT).single();
    if (error) throw new Error(`Failed to update activity: ${error.message}`);
    return mapActivityToDomain(data as unknown as ActivityRow);
  }

  async setActive(input: SetActivityStatusInput): Promise<void> {
    const { error } = await this.supabase.from("activities").update({ active: input.active })
      .eq("organization_id", input.organizationId).eq("id", input.id);
    if (error) throw new Error(`Failed to update activity status: ${error.message}`);
  }
}

function mapActivityToDomain(row: ActivityRow): Activity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    defaultDurationMinutes: row.default_duration_minutes,
    defaultPrice: row.default_price === null ? null : Number(row.default_price),
    schedulingMode: row.scheduling_mode,
    professionalRequirement: row.professional_requirement,
    resourceRequirement: row.resource_requirement,
    specialtyId: row.specialty_id,
    specialtyName: row.professional_specialties?.name ?? null,
    specialtyColor: row.professional_specialties?.color ?? null,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
