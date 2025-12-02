export type IDataType = "string" | "number" | "boolean" | "date";
export interface ITableHeader {
  column: string;
  alias: string;
  visible: boolean;
  dataType: IDataType;
}

export const tableHeaderUpc: ITableHeader[] = [
  { column: "product_code", alias: "UPC", visible: true, dataType: "string" },
  { column: "description", alias: "Desc", visible: true, dataType: "string" },
  { column: "week", alias: "Week", visible: true, dataType: "string" },
  { column: "Monday", alias: "Monday", visible: true, dataType: "number" },
  { column: "Tuesday", alias: "Tuesday", visible: true, dataType: "number" },
  {
    column: "Wednesday",
    alias: "Wednesday",
    visible: true,
    dataType: "number",
  },
  { column: "Thursday", alias: "Thursday", visible: true, dataType: "number" },
  { column: "Friday", alias: "Friday", visible: true, dataType: "number" },
  { column: "Saturday", alias: "Saturday", visible: true, dataType: "number" },
  { column: "Sunday", alias: "Sunday", visible: true, dataType: "number" },
];

export const tableHeaderForecast: ITableHeader[] = [
  {
    column: "upc",
    alias: "UPC",
    visible: true,
    dataType: "string",
  },
  {
    column: "description",
    alias: "Desc",
    visible: true,
    dataType: "string",
  },
  {
    column: "date",
    alias: "Date",
    visible: true,
    dataType: "string",
  },
  {
    column: "quantity",
    alias: "Quantity",
    visible: true,
    dataType: "number",
  },
];

export const tableHeaderForecastMetrics: ITableHeader[] = [
  {
    column: "upc",
    alias: "UPC",
    visible: true,
    dataType: "string",
  },
  {
    column: "description",
    alias: "Desc",
    visible: true,
    dataType: "string",
  },
  {
    column: "avg_daily_qty",
    alias: "Avg Daily Qty",
    visible: true,
    dataType: "number",
  },
  {
    column: "days_active",
    alias: "Days Active",
    visible: true,
    dataType: "number",
  },
  {
    column: "max_day_qty",
    alias: "Max Day Qty",
    visible: true,
    dataType: "number",
  },
  {
    column: "qty",
    alias: "Qty",
    visible: true,
    dataType: "number",
  },
];

export const priceOptHeaders: ITableHeader[] = [
  {
    column: "product_code",
    alias: "UPC",
    visible: true,
    dataType: "string",
  },
  {
    column: "product_description",
    alias: "Desc",
    visible: true,
    dataType: "string",
  },
  {
    column: "price",
    alias: "Price",
    visible: true,
    dataType: "number",
  },
  {
    column: "total_qty",
    alias: "Qty",
    visible: true,
    dataType: "number",
  },
  {
    column: "total_revenue",
    alias: "Revenue",
    visible: true,
    dataType: "number",
  },
  {
    column: "total_weight",
    alias: "Weight",
    visible: true,
    dataType: "number",
  },
];

export const trendHeaders: ITableHeader[] = [
  {
    column: "product_code",
    alias: "UPC",
    visible: true,
    dataType: "string",
  },
  {
    column: "product_description",
    alias: "Desc",
    visible: true,
    dataType: "string",
  },
  {
    column: "trend_date",
    alias: "Trend Date",
    visible: true,
    dataType: "string",
  },
  {
    column: "slope_before",
    alias: "Slope Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "slope_after",
    alias: "Slope After",
    visible: true,
    dataType: "number",
  },
  {
    column: "slope_change",
    alias: "Slope Change",
    visible: true,
    dataType: "number",
  },
  {
    column: "trend",
    alias: "Trend Direction",
    visible: true,
    dataType: "string",
  },
  {
    column: "mean_before",
    alias: "Mean Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "mean_after",
    alias: "Mean After",
    visible: true,
    dataType: "number",
  },
  {
    column: "pct_change_mean",
    alias: "Percent Change Mean",
    visible: true,
    dataType: "number",
  },
  {
    column: "total_before",
    alias: "Total Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "total_after",
    alias: "Total After",
    visible: true,
    dataType: "number",
  },
  {
    column: "volatility_before",
    alias: "Volatility Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "volatility_after",
    alias: "Volatility After",
    visible: true,
    dataType: "number",
  },
  {
    column: "active_days_before",
    alias: "Active Days Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "active_days_after",
    alias: "Active Days After",
    visible: true,
    dataType: "number",
  },
  {
    column: "r2-before",
    alias: "R2 Before",
    visible: true,
    dataType: "number",
  },
  {
    column: "r2-after",
    alias: "R2 After",
    visible: true,
    dataType: "number",
  },
  {
    column: "impact_units",
    alias: "Impact Units",
    visible: true,
    dataType: "number",
  },
];
