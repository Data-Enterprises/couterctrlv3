import type { PriceHistoryResult } from "../../../interfaces";
import { fitLinearDemand, predictQty, forecastUnits } from "../../../utils/forecastCalc";

export const formatRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const prices = item.price_history
      .map((p) => [parseFloat(p.price), p.qty])
      .sort((a, b) => b[1] - a[1]);

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

    // (reg retail - fcst prcie) * fcst qty = markdown dollars
    const markdownDollars = (item.regular_retail_price - price) * units;

    return {
      upc: item.upc,
      description: item.description,
      qtySold: prices[0][1],
      daysActive: item.days_active, // active total
      daysAtPrice: daysAtPrice, // active days at price
      calcNow: 0 as 0 | 1,
      adFcst: units,
      fcstPrice: price,
      fcstTotal: price * units,
      forecastWindow: 7,
      adDays: 0, // this show as "" for 0 until user input
      markdownDollars: markdownDollars,
    };
  });
};

export const formatSinglePriceRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const ph = item.price_history[0];
    const price = parseFloat(ph.price);
    const units = forecastUnits(
      price,
      ph.qty,
      ph.qty,
      item.days_active,
      90,
      ph.days_active,
      7,
      [[price, ph.qty]]
    );
    const markdownDollars = (item.regular_retail_price - price) * units;
    return {
      upc: item.upc,
      description: item.description,
      qtySold: ph.qty,
      daysActive: item.days_active,
      daysAtPrice: ph.days_active,
      calcNow: 0 as 0 | 1,
      adFcst: units,
      fcstPrice: price,
      fcstTotal: price * units,
      forecastWindow: 7,
      adDays: 0,
      markdownDollars,
      singlePrice: true as const,
    };
  });
};

