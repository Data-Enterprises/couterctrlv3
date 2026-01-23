import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { HourlySale, SubSale } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import { netSalesPct, promoLeakage } from "../../../functions";

export interface TopSub {
  sub_department: number;
  sub_department_description: string;
  total_sales: number;
  net_sales: number;
  qty: number;
  digital_coupons: number;
  elec_instore_coupons: number;
  elec_store_coupons: number;
  store_coupon: number;
}

export const reduceSubs = (data: SubSale[]): TopSub[] => {
  return [...data].reduce((acc: TopSub[], curr) => {
    const exists = acc.find((d) => d.sub_department === curr.sub_department);
    if (exists) {
      exists.total_sales += curr.total_sales;
      exists.net_sales += curr.net_sales;
      exists.qty += curr.qty;
      exists.digital_coupons += curr.digital_coupons;
      exists.elec_instore_coupons += curr.elec_instore_coupons;
      exists.elec_store_coupons += curr.elec_store_coupons;
      exists.store_coupon += curr.store_coupon;
    } else {
      acc.push({
        sub_department: curr.sub_department,
        sub_department_description: curr.sub_department_description,
        total_sales: curr.total_sales,
        net_sales: curr.net_sales,
        qty: curr.qty,
        digital_coupons: curr.digital_coupons,
        elec_instore_coupons: curr.elec_instore_coupons,
        elec_store_coupons: curr.elec_store_coupons,
        store_coupon: curr.store_coupon,
      });
    }
    return acc;
  }, []);
};

const formatDate = (dateStr: string): string => {
  const split = dateStr.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const theme = themeQuartz.withParams({
  headerHeight: 27,
  rowHeight: 26,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#dbeafe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  selectedRowBackgroundColor: "#fed7aa",
});

export const cols: (ColDef<HourlySale> | ColGroupDef<HourlySale>)[] = [
  {
    field: "sale_date",
    headerName: "Date",
    flex: 1.1,
    valueFormatter: (params) => formatDate(params.value as string),
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    field: "total_sales",
    headerName: "Total Sales",
    flex: 1.1,
    valueFormatter: (params) => formatCurrency2(params.value as number),
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "text-right",
  },
  {
    field: "net_sales",
    headerName: "Net Sales",
    flex: 1.1,
    valueFormatter: (params) => formatCurrency2(params.value as number),
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "text-right",
  },
  {
    field: "qty",
    headerName: "Qty",
    flex: 0.9,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "text-right",
  },
  {
    field: "transactions",
    headerName: "Trans #",
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "text-right",
  },
  {
    field: "net_sales",
    headerName: "Net Sales %",
    flex: 1.3,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => {
      const sale = params.data as HourlySale;
      return netSalesPct(sale.net_sales, sale.total_sales);
    },
    cellClass: (params) => {

      const sale = params.data as HourlySale;
      const pct = parseFloat(netSalesPct(sale.net_sales, sale.total_sales).replace("%", ""));
      return `text-right ${
        pct >= 95 ? "bg-emerald-200" : pct >= 90 ? "bg-yellow-200" : "bg-orange-200"
      }`;
    },
  },
  {
    field: "net_sales",
    headerName: "Leak",
    flex: 0.9,
    valueFormatter: (params) => {
      const sale = params.data as HourlySale;
      return promoLeakage(sale.net_sales, sale.total_sales).toFixed(2) + "%";
    },
    cellClass: (params) => {
      const sale = params.data as HourlySale;
      const leak = promoLeakage(sale.net_sales, sale.total_sales);
      return `text-right ${leak < 2 ? "bg-emerald-200" : "bg-orange-200"}`;
    },
  },
];
