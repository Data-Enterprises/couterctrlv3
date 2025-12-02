import type {
  UpcData,
  // UpcForecast,
  ForecastExport,
  ForecastMetrics,
  UpcForecast,
  Forecast,
  Handlers,
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

export interface LineData {
  id: string;
  data: { x: string; y: number }[];
  color: string;
}
[];

export const modeData = [
  { label: "Sales", value: "sales" },
  { label: "Quantity", value: "quantity" },
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
export const sameWeekDayThisYear = (ly: string) => {
  const lyDte = new Date(ly);
  const year = lyDte.getFullYear();

  const isLeapYr = (y: number) =>
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const crossesLeapYr = isLeapYr(year) && lyDte < new Date(`${year}-02-29`);

  const daysToAdd = crossesLeapYr ? 365 : 364;
  const result = new Date(lyDte);
  result.setDate(result.getDate() + daysToAdd);

  const testing = {
    date: result.toISOString().split("T")[0].split("-").splice(1, 2).join("/"),
    dow: days[result.getDay()],
  };

  return testing;
};

export const instructions = [
  {
    text: "1. Select one or more UPCs (left) to view the history/forecast data line chart",
  },
  {
    text: "2. The forecast date range extends 7 days beyond the selected end date",
  },
  {
    text: "3. Individual UPCs can be selected in the line chart legend (bottom)",
  },
  {
    text: "4. Selected item metrics can be viewed inside the carousel (slide 2)",
  },
  { text: `5. Hovering over the icons will display each metric definition` },
  {
    text: "6. Export either the Date Range or Metrics to a .csv file (top right)",
  },
];

export const colorCodes = [
  "#d946ef", // fuchsia-500
  "#f0abfc", // fuchsia-300
  "#3b82f6", // blue-500
  "#60a5fa", // blue-300
  "#10b981", // emerald-500
  "#6ee7b7", // emerald-300
  "#4fd1c5", // teal-400
  "#99f6e4", // teal-200
  "#f97316", // orange-500
  "#fdba74", // orange-300
];

export const convertData = (
  id: string,
  data: { date: string; value: number }[],
  idx: number,
  type = "history",
  results: any,
): Forecast => {
  const newData = {
    id: `${id} - ${type}`,
    data: data
      .map((item) => ({
        x: item.date.split("/").splice(0, 2).join("/"),
        y: item.value,
      }))
      .slice(-7),
    color: colorCodes[idx % colorCodes.length],
  };

  if (type === "forecast") {
    // Find the last date in the history data for that upc and shift the forecast dates accordingly => attaches both history and forecast on the chart
    const historyEntry = Object.entries(results)
      .map(([k, v]) => [k, structuredClone(v as UpcForecast).history])
      .find(([k]) => k === id);
    if (!historyEntry) return newData;
    const historyDates = historyEntry[1] as {
      date: string;
      value: number;
    }[];
    const lastHistoryDate = historyDates[historyDates.length - 1] as {
      date: string;
      value: number;
    };
    newData.data.unshift({
      x: lastHistoryDate.date.split("/").splice(0, 2).join("/"),
      y: lastHistoryDate.value,
    });
  }
  return newData;
};

export type ContextEvent = React.MouseEvent<
  HTMLTableRowElement | HTMLDivElement
>;
export type Option = {
  label: string;
  key: keyof Handlers;
  children?: Option[];
  value?: string;
};

export const options: Option[] = [
  { label: "Copy UPC", key: "copyUpc" },
  { label: "Copy Description", key: "copyDesc" },
  { label: "Show Prices", key: "selectUpc" },
];