// Interfaces
import type { Company } from "../../../../../interfaces";

export type CompanyRecord = Company & { parent_company_id?: number | null };