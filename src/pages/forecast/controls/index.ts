import { forecastUnits } from "../../priceSimulator/calc";
import { fitLinearDemand, predictQty } from "../utils";
import type { PriceHistoryResult } from "../../../interfaces";

export const formatRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const prices = item.price_history.map((p) => [parseFloat(p.price), p.qty]);

    const linear = fitLinearDemand(prices);
    const predictedQty = predictQty(prices[0][0], linear, prices);
    const price = prices[0][0];
    const daysAtPrice = item.price_history.find(
      (p) => parseFloat(p.price) === price
    )!.days_active;

    const units = forecastUnits(
      price, // 9.99
      item.qty, // overall units sold in period
      predictedQty, // 120 => from last 90 days
      item.days_active, // total selling days
      90, // on 90 day period
      daysAtPrice, // days at price => based on the price history => 3
      7, // forecastwindow
      prices // price history to get qty at price
      // adDays === undefined
    );

    return {
      upc: item.upc,
      description: item.description,
      qtySold: prices[0][1],
      daysActive: item.days_active, // active total
      daysAtPrice: daysAtPrice, // active days at price
      adFcst: units,
      fcstPrice: price,
      fcstTotal: price * units,
      forecastWindow: 7,
      adDays: 0, // this show as "" for 0 until user input
    };
  });
};
