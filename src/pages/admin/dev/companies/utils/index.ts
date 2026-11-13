// Interfaces
import type { Company } from "../../../../../interfaces";
import type { CompanyRecord } from "../interfaces";

export const blankCompany: Company = {
  id: 0,
  address: "",
  city: "",
  contact_email: "",
  name: "",
  phone: "",
  state: "",
  zip: 0,
};

export const canSubmit = (c: Company) =>
  c.name !== "" &&
  c.address !== "" &&
  c.city !== "" &&
  c.contact_email !== "" &&
  c.state !== "" &&
  c.zip !== 0 &&
  c.phone !== "";

export const companyCols = [
  "Name",
  "City",
  "State",
  "Phone",
  "Contact Email",
  "",
];

export const membersOf = (
  companies: CompanyRecord[],
  id: number | undefined,
) =>
  id === undefined ? [] : companies.filter((c) => c.parent_company_id === id);

export const parentChoices = (
  companies: CompanyRecord[],
  editingId: number | undefined,
) =>
  companies
    .filter((c) => !c.parent_company_id && c.id !== editingId)
    .map((c) => ({ label: c.name, value: String(c.id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
