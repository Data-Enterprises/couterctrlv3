import { calcFcstQty } from "../../priceSimulator/calc";
import type { PriceHistoryResult } from "../../../interfaces";

export const formatRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const prices = item.price_history.map((p) => [parseFloat(p.price), p.qty]);

    const fcstPrice = prices[0][0];
    const fcstQty = calcFcstQty(prices, fcstPrice);
    const fcstDollars = fcstPrice * fcstQty;

    const regQty =
      item.price_history.find(
        (p) => p.price === item.regular_retail_price.toString()
      )?.qty || 0;

    const regDollars = item.regular_retail_price * regQty;
    const markdownDollars = (item.regular_retail_price - fcstPrice) * fcstQty;
    const lift = regQty > 0 ? (fcstQty - regQty) / regQty : 0;

    return {
      upc: item.upc,
      description: item.description,
      fcstPrice: fcstPrice,
      calcNow: 0 as 0 | 1,
      fcstQty: fcstQty,
      fcstDollars: fcstDollars,
      regRetail: item.regular_retail_price,
      regQty: regQty,
      regDollars: regDollars,
      markdownDollars: markdownDollars,
      lift: lift,
      prices: prices,
    };
  });
};
