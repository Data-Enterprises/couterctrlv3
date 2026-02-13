import axios from "axios";
import type { CompanyBaseGroup } from "../interfaces";

export const getBaseGroups = async (
  url: string,
  token: string,
  company: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/base_groups",
    params: {
      company,
    },
  });
  return json;
};

export const createBaseGroup = async (
  url: string,
  token: string,
  data: CompanyBaseGroup,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/create_base_group",
    data: {
      name: data.name,
      company: data.company,
    },
  });
  return json;
};

export const updateBaseGroup = async (
  url: string,
  token: string,
  data: CompanyBaseGroup,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/update_base_group",
    data: data,
  });
  return json;
};

export const deleteBaseGroup = async (
  url: string,
  token: string,
  id: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/delete_base_group",
    params: {
      id,
    },
  });
  return json;
};
