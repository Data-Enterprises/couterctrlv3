import { useAppSelector } from "../../hooks";
import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { CouponItem } from "../../interfaces";
import { formatCurrency2, formatDate } from "../../utils";

export const useCouponContext = () => {
  const devMode = useAppSelector((state) => state.app.devMode);
  const {
    coupons,
    isFetching,
    gridCoupons,
    noCouponsFound,
    couponMobileStage,
    uniqueCpnDates,
    uniqueSubDepts,
    subDeptMobileFilter,
    uniqueDateMobileFilter,
    showSubsMobileFilter,
  } = useAppSelector((state) => devMode ? state.coupons : state.couponLegacy);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { url, token, isMobile, isTablet } = useAppSelector((state) => state.app);

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
    noCouponsFound,
    isMobile,
    couponMobileStage,
    uniqueCpnDates,
    uniqueSubDepts,
    subDeptMobileFilter,
    uniqueDateMobileFilter,
    showSubsMobileFilter,
    isTablet
  };
};

export const theme = themeQuartz.withParams({
  headerHeight: 26,
  rowHeight: 26,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#dbeafe",
  rowHoverColor: "#93c5fd",
  // headerFontWeight: "bold",
  dataFontSize: 12,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  // selectedRowBackgroundColor: "#93c5fd",
  selectedRowBackgroundColor: "#fed7aa",
});

const defaultOptions = {
  cellClass: "no-outline-on-focus",
  headerClass: "text-[12.5px] font-medium",
};

export const cols: (ColDef<CouponItem> | ColGroupDef<CouponItem>)[] = [
  {
    headerName: "Store",
    field: "store_number",
    flex: 0.6,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Date",
    field: "sale_date",
    flex: 0.8,
    valueFormatter: (params) => formatDate(params.value),
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Trans",
    field: "sale_id",
    flex: 0.7,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Cpn Type",
    field: "coupon_type",
    flex: 0.8,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Cpn Amt",
    field: "coupon_amount",
    flex: 0.9,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "UPC",
    field: "product_code",
    flex: 0.8,
    valueFormatter: (params) =>
      params.value ? params.value.split(".")[0] : "",
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Desc",
    field: "product_description",
    flex: 2.4,
    ...defaultOptions,
    headerStyle: { borderRight: "1px solid white" },
  },
  {
    headerName: "Cashier #",
    field: "cashier_number",
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
];
