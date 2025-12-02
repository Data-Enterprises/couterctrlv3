import axios from "axios";

export const getSalesComp = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  file: File
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
  file: File
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
  file: File
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
  storeids: string,
  userid: number,
  startdate: string,
  enddate: string,
  periods: number = 120,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  const json = await axios({
    method: "POST",
    url: url + "marketing/trend_detector",
    data: formData,
    params: {
      storeids,
      userid,
      startdate,
      enddate,
      periods,
    },
  });

  return json;
};
