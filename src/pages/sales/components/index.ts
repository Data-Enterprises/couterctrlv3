import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { couponSalePct, netSalesPct } from "../../../functions";

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
  total_tax: number;
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
      exists.total_tax += curr.total_tax;
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
        total_tax: curr.total_tax,
      });
    }
    return acc;
  }, []);
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
  headerFontSize: 14,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  selectedRowBackgroundColor: "#fed7aa",
});

export interface HourlyTotal {
  hour:number;
  total_sales: number;
  trans: number;
}

export const cols: (ColDef<HourlyTotal> | ColGroupDef<HourlyTotal>)[] = [
  {
    field: "hour",
    headerName: "Hr",
    flex: 0.8,
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
  },
  {
    field: "total_sales",
    headerName: "Total Sales",
    flex: 1.3,
    valueFormatter: (params) => formatCurrency2(params.value as number),
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
    cellClass: "text-right",
  },
  {
    field: "trans",
    headerName: "Transactions",
    flex: 0.9,
    resizable: false,
    cellClass: "text-right",
  },
];

// Dept, Dept Id, Total Sales, Net Sales, Qty, Coupon %, Net Sales %, Promo Leakage
export const subCols: (ColDef<SubSale> | ColGroupDef<SubSale>)[] = [
  {
    field: "sub_department_description",
    headerName: "Dept",
    flex: 1.2,
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
  },

  {
    field: "total_sales",
    headerName: "Sales",
    flex: 1.3,
    valueFormatter: (params) => {
      const data = params.data as SubSale;
      return formatCurrency2(data.total_sales - data.total_tax);
    },
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
    cellClass: "text-right",
  },
  {
    field: "net_sales",
    headerName: "Net Sales",
    flex: 1,
    valueFormatter: (params) => formatCurrency2(params.value as number),
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
    cellClass: "text-right",
  },
  {
    field: "qty",
    headerName: "Qty",
    flex: 0.8,
    valueFormatter: (params) => formatBigNumber(params.value as number, 0),
    headerStyle: { borderRight: "1px solid white" },
    resizable: false,
    cellClass: "text-right",
  },
  {
    field: "digital_coupons",
    headerName: "Cpn %",
    flex: 0.8,
    resizable: false,
    valueFormatter: (params) => {
      const sale = params.data as SubSale;
      const coupons = [
        sale.digital_coupons,
        sale.elec_instore_coupons,
        sale.elec_store_coupons,
        sale.store_coupon,
      ];
      const pct = couponSalePct(coupons, sale.total_sales);
      return pct;
    },
    headerStyle: { borderRight: "1px solid white" },
    cellClass: 'text-right'
  },
  {
    field: "net_sales",
    headerName: "Net Sales %",
    flex: 1.2,
    resizable: false,
    valueFormatter: (params) => {
      const sale = params.data as SubSale;
      const salesMinusTax = sale.total_sales - sale.total_tax;
      return netSalesPct(sale.net_sales, salesMinusTax);
    },
    cellClass: (params) => {
      const sale = params.data as SubSale;
      const salesMinusTax = sale.total_sales - sale.total_tax;
      const pct = parseFloat(
        netSalesPct(sale.net_sales, salesMinusTax).replace("%", ""),
      );
      return `text-right hover:bg-blue-200 cursor-pointer transition-all duration-200 ${
        pct >= 95
          ? "bg-emerald-200"
          : pct >= 90
            ? "bg-yellow-200"
            : "bg-orange-200"
      }`;
    },
  },
];
