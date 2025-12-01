import type {
  UpcData,
  // UpcForecast,
  ForecastExport,
  ForecastMetrics,
} from "../../interfaces";

export const formatForecastExport = (forecastData: any) => {
  const dataExport: ForecastExport[] = [];
  const metricExport: ForecastMetrics[] = [];
  for (const key in forecastData) {
    // grab upc and description => concat history/forecast => push export data into dataExport
    const upc = key;
    const desc = forecastData[key].metrics.description;
    const data = [...forecastData[key].history, ...forecastData[key].forecast];
    data.forEach((item) => {
      // push the date/qty data into dataExport for all dates for each upc
      dataExport.push({
        upc,
        description: desc,
        date: item.date,
        quantity: item.value,
      });

      // push the metrics data into metricExport - only once per upc
      const found = metricExport.find((m) => m.upc === upc);
      if (!found) {
        metricExport.push({
          upc,
          description: desc,
          avg_daily_qty: forecastData[key].metrics.avg_daily_qty.toFixed(2),
          days_active: forecastData[key].metrics.days_active,
          max_day_qty: forecastData[key].metrics.max_day_qty,
          qty: forecastData[key].metrics.qty,
        });
      }
    });
  }

  return { data: dataExport, metrics: metricExport };
};

export const aggregateData = (x: UpcData[]) => {
  const result: UpcData[] = [];
  x.forEach((item: UpcData) => {
    const found = result.find(
      (r) =>
        r.sale_date === item.sale_date &&
        r.product_code === item.product_code &&
        r.store_number === item.store_number
    );
    if (found) {
      found.qty += item.qty;
      found.weight += item.weight;
      found.sales += Number(item.sales.toFixed(2));
    } else {
      result.push({ ...item, sales: Number(item.sales.toFixed(2)) });
    }
  });

  return result.sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );
};

// export const getList = (data: any, type = "notForecast") => {
//   if (type === "forecast") {
//     return data.map(([k, v]) => ({
//       product_code: k,
//       product_description: (v as UpcForecast).metrics.description,
//     }));
//   } else {
//     return data.map((item) => ({
//       product_code: item.product_code,
//       product_description: item.product_description,
//     }));
//   }
// };
