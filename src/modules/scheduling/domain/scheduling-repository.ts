import type { SchedulingPageData } from "./scheduling";

export interface SchedulingRepository {
  getPageData(organizationId: string): Promise<SchedulingPageData>;

  createAppointment(input: {
    customerId: string;
    activityId: string;
    customerSubscriptionId?: string | null;
    startsAt: string;
    endsAt: string;
    professionalId?: string | null;
    resourceIds?: string[];
  }): Promise<string>;

  createScheduleRule(input: {
    customerSubscriptionId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    professionalId?: string | null;
    resourceIds?: string[];
  }): Promise<string>;

  cancelAppointment(input: {
    organizationId: string;
    appointmentId: string;
    reason: string;
  }): Promise<void>;

  setActivityResourceRequirement(input: {
    organizationId: string;
    activityId: string;
    resourceTypeId: string;
    quantity: number;
  }): Promise<void>;

  setProfessionalQualification(input: {
    organizationId: string;
    professionalId: string;
    activityId: string;
    enabled: boolean;
  }): Promise<void>;

  setScheduleRuleStatus(input: {
    scheduleRuleId: string;
    status: "ACTIVE" | "PAUSED" | "ENDED";
  }): Promise<void>;

  updateGenerationWindow(input: {
    organizationId: string;
    generationWindowDays: number;
    cancellationWindowMinutes: number;
  }): Promise<void>;

  refreshOrganizationWindow(organizationId: string): Promise<void>;
}
