import type { Professional } from "./professional";

export interface ProfessionalRepository {
  create(input: {
    organizationId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<Professional>;
}
