import axios from "axios";

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
    url: url + "marketing/forecasting",
    params: {
      storeids,
      startdate,
      enddate,
    },
    data: formData,
  });
  return json;
};

export const getPriceHistory = async (
  url: string,
  token: string,
  storeids: string,
  enddate: string,
  single_upc: string,
  forecast: number = 0
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/price_history",
    params: {
      storeids,
      enddate,
      single_upc,
      forecast,
    },
  });
  return json;
};
