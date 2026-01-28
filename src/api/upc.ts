import axios from "axios";

export const getSalesComp = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/upload_upcs_daily_sales",
    data: formData,
    params: {
      storeids,
      startdate,
      enddate,
    },
  });

  return json;
};

export const getForecasting = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/upload_upcs",
    data: formData,
    params: {
      storeids,
      startdate,
      enddate,
    },
  });

  return json;
};

export const getPriceOpt = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/upload_upcs_price_optimizer",
    data: formData,
    params: {
      storeids,
      startdate,
      enddate,
    },
  });

  return json;
};

export const getTrendDetect = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  periods: number = 120,
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/trend_detector",
    data: formData,
    params: {
      storeids,
      startdate,
      enddate,
      periods,
    },
  });

  return json;
};

export const getItemAssociation = async (
  url: string,
  token: string,
  startdate: string,
  enddate: string,
  storeids: number[],
  upcs: string[],
  limit: number = 20,
  topBottomOrAll: "top" | "bottom" | "all",
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "items/item_association",
    data: {
      storeids,
      startdate,
      enddate,
      upcs,
      limit,
      topBottomOrAll,
    },
  });

  return json;
};
