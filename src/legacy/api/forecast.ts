import axios from "axios";
import type { SaveSimRow } from "../pages/forecast";

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

export const getBucketList = async (url: string, token: string) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/s3_file_list",
  });
  return json;
};

export const getFromExistingS3File = async (
  url: string,
  token: string,
  storeids: string,
  startdate: string,
  enddate: string,
  filename: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/forecasting_from_existing_s3_file",
    params: {
      storeids,
      startdate,
      enddate,
      filename,
    },
  });
  return json;
};

export const getSavedSims = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/sim-list",
  });
  return json;
};

export const saveSim = async (
  url: string,
  token: string,
  simName: string,
  startDate: string,
  endDate: string,
  storeids: string,
  data: SaveSimRow[]
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/save_sim",
    data: {
      simName,
      startDate,
      endDate,
      storeids,
      data,
    },
  });
  return json;
};

export const replaySim = async (
  url: string,
  token: string,
  sim_name: string
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/replay_sim",
    params: {
      sim_name,
    },
  });
  return json;
};
