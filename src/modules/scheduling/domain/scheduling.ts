export type AppointmentStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";
export type AppointmentSource = "RECURRENCE" | "MANUAL" | "MAKEUP" | "RESCHEDULE";
export type ScheduleRuleStatus = "ACTIVE" | "PAUSED" | "ENDED";

export type SchedulingSettings = {
  schedulingEnabled: boolean;
  generationWindowDays: number;
};

export type SchedulingCustomer = {
  id: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
  active: boolean;
};

export type ProfessionalAvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type ProfessionalScheduleException = {
  id: string;
  exceptionType: "ABSENCE" | "PRESENCE";
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type SchedulingProfessional = {
  id: string;
  name: string;
  active: boolean;
  activityIds: string[];
  availabilityRules: ProfessionalAvailabilityRule[];
  scheduleExceptions: ProfessionalScheduleException[];
};

export type SchedulingResourceType = {
  id: string;
  name: string;
  active: boolean;
};

export type SchedulingResource = {
  id: string;
  name: string;
  active: boolean;
  resourceTypeId: string | null;
  resourceTypeName: string | null;
};

export type SchedulingSubscription = {
  id: string;
  customerId: string;
  activityId: string;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  billingCycle: string;
  startsAt: string;
  endsAt: string | null;
};

export type ScheduleRule = {
  id: string;
  customerId: string;
  customerSubscriptionId: string;
  activityId: string;
  professionalId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: ScheduleRuleStatus;
  resourceIds: string[];
};

export type Appointment = {
  id: string;
  customerId: string;
  customerSubscriptionId: string | null;
  activityId: string;
  professionalId: string | null;
  scheduleRuleId: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  cancellationReason: string | null;
  resourceIds: string[];
};

export type ActivityResourceRequirement = {
  activityId: string;
  resourceTypeId: string;
  resourceTypeName: string;
  quantity: number;
};

export type ScheduleGenerationConflict = {
  id: string;
  scheduleRuleId: string;
  startsAt: string;
  endsAt: string;
  reason: "CAPACITY_CONFLICT";
};

export type SchedulingPageData = {
  settings: SchedulingSettings;
  customers: SchedulingCustomer[];
  activities: import("@/modules/activities/domain/activity").Activity[];
  specialties: { id: string; name: string; color: string; active: boolean }[];
  professionals: SchedulingProfessional[];
  resourceTypes: SchedulingResourceType[];
  resources: SchedulingResource[];
  activityResourceRequirements: ActivityResourceRequirement[];
  subscriptions: SchedulingSubscription[];
  rules: ScheduleRule[];
  conflicts: ScheduleGenerationConflict[];
  appointments: Appointment[];
};
