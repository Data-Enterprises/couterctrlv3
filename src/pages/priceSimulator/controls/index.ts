import type { ForecastQtyData, ForecastSalesData } from "../../../interfaces";


export const formatQtyOutput = (data: any): ForecastQtyData<any>[] => {
  return Object.entries(data.qty_output).map(([k, v]) => {
    const upc = k as string;
    const data = v as any;
    return {
      upc,
      history: data.history,
      history_dimension: data.history_dimension,
      forecast: data.forecast,
      forecast_dimension: data.forecast_dimension,
      forecast_method: data.forecast_method,
      metrics: data.metrics,
    };
  });
};

export const formatSalesOutput = (data: any): ForecastSalesData<any>[] => {
  return Object.entries(data.sales_output).map(([k, v]) => {
    const upc = k as string;
    const data = v as any;
    return {
      upc,
      history: data.history,
      history_dimension: data.history_dimension,
      forecast: data.forecast,
      forecast_dimension: data.forecast_dimension,
      forecast_method: data.forecast_method,
      metrics: data.metrics,
    };
  });
};