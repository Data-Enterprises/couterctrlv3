import axios from "axios";

export const getAvailableOrders = async (
  url: string,
  token: string,
  start_date: string,
  end_date: string,
  storeids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "orders/available_order",
    data: {
      start_date,
      end_date,
      storeids,
    },
  });

  return json;
};

export const getAllOrders = async (
  url: string,
  token: string,
  start_date: string,
  end_date: string,
  storeids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "orders/all_orders",
    data: {
      start_date,
      end_date,
      storeids,
    },
  });

  return json;
};
