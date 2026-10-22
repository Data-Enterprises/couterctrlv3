import axios from "axios";
import type { Company } from "../interfaces";

export const getCompanies = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "company/get_companies",
  });
  return json;
};

/**
 * The company a company belongs under, as create and update send it.
 *
 * `undefined` sends nothing, which is what the prod form does: it has no such
 * field, so its saves must leave a parent alone rather than clear it. `null`
 * is "stands alone" and a number is the parent's id; only the dev form sends
 * either. Families are one level deep, the rule `familyOf` in
 * pages/organization/dev/scoping reads.
 */
type ParentChoice = number | null | undefined;

const parentField = (parent: ParentChoice) =>
  parent === undefined ? {} : { parent_company_id: parent };

export const createCompany = async (
  url: string,
  token: string,
  data: Company,
  parent?: ParentChoice,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "company/create_company",
    data: {
      company_name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      contact_email: data.contact_email,
      ...parentField(parent),
    },
  });
  return json;
};

export const updateCompany = async (
  url: string,
  token: string,
  data: Company,
  parent?: ParentChoice,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "company/update_company",
    data: {
      company_id: data.id,
      company_name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      contact_email: data.contact_email,
      ...parentField(parent),
    },
  });
  return json;
};

export const deleteCompany = async (
  url: string,
  token: string,
  company_id: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "company/delete_company",
    data: {
      company_id,
    },
  });
  return json;
};
