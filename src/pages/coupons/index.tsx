import { useAppSelector } from "../../hooks";
import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { CouponItem } from "../../interfaces";
import { formatDate } from "../../utils";

export const useCouponContext = () => {
  const { coupons, isFetching, gridCoupons } = useAppSelector((state) => state.coupons);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search
  );
  const { url, token } = useAppSelector((state) => state.app);

  return {
    url,
    token,
    coupons,
    startDate,
    endDate,
    type,
    lastStore,
    lastGroup,
    isFetching,
    gridCoupons,
  };
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
  selectedRowBackgroundColor: "#93c5fd",
});

const defaultOptions = {
  cellClass: "no-outline-on-focus",
  resizable: false,
};

export const cols: (ColDef<CouponItem> | ColGroupDef<CouponItem>)[] = [
  {
    headerName: "Store",
    field: "store_number",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Cashier",
    field: "cashier_name",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Term",
    field: "terminal",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Sale ID",
    field: "sale_id",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Date",
    field: "sale_date",
    flex: 1,
    valueFormatter: (params) => formatDate(params.value),
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "UPC",
    field: "product_code",
    flex: 1,
    valueFormatter: (params) =>
      params.value ? params.value.split(".")[0] : "",
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Desc",
    field: "product_description",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Cpn Type",
    field: "coupon_type",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Sale Type",
    field: "sale_type",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Line #",
    field: "line_number",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Customer",
    field: "customer_name",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Customer ID",
    field: "customer_id",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Sub Dept",
    field: "sub_department_description",
    flex: 1,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Category",
    field: "category_description",
    flex: 1,
    ...defaultOptions,
  },
];
