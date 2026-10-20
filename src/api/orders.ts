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

/**
 * Submit an edited order.
 *
 * `update_file` does not write to the `orders` table: it builds a CSV, drops
 * it in the provider import bucket and logs the drop, and the import picks it
 * up later. So a 200 here means submitted, not saved, and re-reading the
 * order before the import runs still returns the old figures. See
 * `pages/orders/dev/orderEdit.ts` for what goes in `lines` and why it is
 * every line of the order rather than only the changed ones.
 *
 * `error: 1` comes back as HTTP 200, the same as the rest of the house, so
 * the body decides whether it worked.
 */
export const updateOrderFile = async (
  url: string,
  token: string,
  storeid: number,
  lines: unknown[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "orders/update_file",
    data: {
      storeid,
      lines,
    },
  });

  return json;
};
