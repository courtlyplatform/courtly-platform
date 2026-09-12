import type { ProfessionalPageData } from './professional';
export interface ProfessionalRepository { getPageData(organizationId:string): Promise<ProfessionalPageData>; }
