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

export const createCompany = async (
  url: string,
  token: string,
  data: Company,
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
    },
  });
  return json;
};

export const updateCompany = async (
  url: string,
  token: string,
  data: Company,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "company/create_company",
    data: {
      company_id: data.id,
      company_name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      contact_email: data.contact_email,
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
