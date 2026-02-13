import axios from "axios";
import type { Vendor } from "../interfaces";

export const getVendors = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "vendors/get_vendors",
  });
  return json;
};

export const createVendor = async (
  url: string,
  token: string,
  data: Vendor,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "vendors/create_vendor",
    data: {
      vendor_name: data.vendor_name,
      company_name: data.company_name,
      address: data.address,
      city: data.city,
      phone: data.phone,
      zip: data.zip,
      contact_email: data.contact_email,
    },
  });
  return json;
};

export const updateVendor = async (
  url: string,
  token: string,
  data: Vendor,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "vendors/update_vendor",
    data: data,
  });
  return json;
};

export const deleteVendor = async (
  url: string,
  token: string,
  vendor_id: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "vendors/delete_vendor",
    data: {
      vendor_id,
    },
  });
  return json;
};
