import type { CustomerListItem } from "@/modules/customers/types";
import type { Activity } from "@/modules/activities/domain/activity";
import type { Professional, ProfessionalSpecialty } from "@/modules/professionals/domain/professional";
import type { ScheduleRule, ScheduleGenerationConflict } from "@/modules/scheduling/domain/scheduling";
import type { FinancialRevenue } from "@/modules/financial/domain/financial";
import type { AttendanceAppointment } from "@/modules/attendance/ui/AttendanceClient";
export type PageSize = 10 | 20 | 50 | 100;
export type Filters = Record<string, string>;
export type ModuleItems = {
 customers: CustomerListItem; services: Activity; professionals: Professional;
 specialties: ProfessionalSpecialty; exceptions: NonNullable<Professional["scheduleExceptions"]>[number];
 rules: ScheduleRule & {conflicts: ScheduleGenerationConflict[]}; attendance: AttendanceAppointment; revenues: FinancialRevenue;
};
export type ListModule = keyof ModuleItems;
export interface PaginationParams { page: number; pageSize: PageSize }
export type RevenueTotals = {billedRevenue:number;receivedRevenue:number;receivableRevenue:number;overdueRevenue:number};
export interface PaginatedResult<T> extends PaginationParams {
 items: T[]; revenueTotals?: RevenueTotals; total: number; totalPages: number;
}
export function normalizePagination(input: { page?: number; pageSize?: number }): PaginationParams {
 return {page: Number.isSafeInteger(input.page) ? Math.max(1, Math.min(2147483647, input.page!)) : 1,
 pageSize: [10,20,50,100].includes(input.pageSize ?? 0) ? input.pageSize as PageSize : 10};
}
