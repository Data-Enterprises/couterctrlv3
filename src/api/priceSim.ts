import axios from "axios";

export const getHistoryFromList = async (
  url: string,
  token: string,
  storeids: string,
  enddate: string,
  upc_list: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "marketing/price_history_from_list",
    params: {
      storeids,
      enddate,
      upc_list,
    },
  });

  return json;
};
