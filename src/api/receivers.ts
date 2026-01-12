import axios from "axios";

export const getReceiversList = async (
  url: string,
  token: string,
  storeid: number,
  startdate: string,
  enddate: string
) => {
  const json = await axios({
    method: "GET",
    url: url + "receivers/",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    params: {
      storeid,
      startdate,
      enddate,
    },
  });
  return json;
};

export const getReceiverDetails = async (
  url: string,
  token: string,
  storeid: number,
  transaction_number: number,
  transaction_date: string
) => {
  const json = await axios({
    method: "GET",
    url: url + "receivers/details",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    params: {
      storeid,
      transaction_number,
      transaction_date,
    },
  });
  return json;
};
