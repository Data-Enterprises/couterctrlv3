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

/**
 * Every receiver carrying any of `productCodes`, lines included.
 *
 * The bulk form of `receivers/details`. Asking when a UPC last arrived used to
 * mean opening every invoice in the lookback one at a time, because nothing
 * mapped an item back to the receivers holding it.
 *
 * Paged by RECEIVER rather than by line, so reading page 1 alone drops whole
 * deliveries — always walk `total_pages`.
 *
 * `includeAllLines` returns every line on a matched receiver instead of only
 * the matching ones. Off here: Item Actions answers for the list it was given,
 * and the rest would be several hundred invoices' worth of lines nothing reads.
 *
 * Dates are ISO `yyyy-mm-dd`, unlike the two calls above it. This is a POST
 * body bound to a Pydantic `date`; the `m/d/yyyy` that `formatDate` produces
 * for the query-string endpoints is rejected as "input is too short".
 */
export const searchReceiversByItem = async (
  url: string,
  token: string,
  storeid: number,
  productCodes: string[],
  startDate: string,
  endDate: string,
  page: number = 1,
  includeAllLines: boolean = false
) => {
  const json = await axios({
    method: "POST",
    url: url + "receivers/item_search",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    data: {
      storeid,
      productCodes,
      startDate,
      endDate,
      page,
      includeAllLines,
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
