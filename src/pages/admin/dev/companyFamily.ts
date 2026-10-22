import type { Company } from "../../../interfaces";

/** A company as `get_companies` returns it since 22 Oct: with the company it
 *  belongs under, or null when it stands alone. */
export type CompanyRecord = Company & { parent_company_id?: number | null };

/**
 * The companies that belong under this one.
 *
 * One that has any heads a family, and can't take a parent itself: families
 * are one level deep (`familyOf` in organization/dev/scoping, the backend's
 * `coalesce(parent_company_id, id)`), so a second level would quietly take its
 * members out of the family.
 */
export const membersOf = (companies: CompanyRecord[], id: number | undefined) =>
  id === undefined ? [] : companies.filter((c) => c.parent_company_id === id);

/**
 * Who a company can belong under: anyone who stands alone, apart from itself.
 * A company that already belongs under another can't be a parent, for the
 * same one-level reason.
 */
export const parentChoices = (
  companies: CompanyRecord[],
  editingId: number | undefined,
) =>
  companies
    .filter((c) => !c.parent_company_id && c.id !== editingId)
    .map((c) => ({ label: c.name, value: String(c.id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
