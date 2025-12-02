export type IDataType = "string" | "number" | "boolean" | "date";
export interface ITableHeader {
  column: string;
  alias: string;
  visible: boolean;
  dataType: IDataType;
}
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
