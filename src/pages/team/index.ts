import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { User } from "../../interfaces";

export const userData = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  user_level: "",
  company: "",
  confirmPassword: "",
  role: "9",
};

export type CustomSelectOption = {
  value: number | string;
  label: string;
};
export const userLevels: CustomSelectOption[] = [
  { value: 1, label: "USER" },
  { value: 2, label: "TECH" },
  { value: 3, label: "STORE MANAGER" },
  { value: 4, label: "HELP DESK" },
  { value: 5, label: "HELP DESK MANAGEMENT" },
  { value: 6, label: "POWER USER" },
  { value: 7, label: "OWNER" },
  { value: 8, label: "ADMIN" },
  { value: 9, label: "PROGRAMMER" },
];

export const roles: CustomSelectOption[] = [
  { value: "1", label: "Single Store" },
  { value: "2", label: "Multi Store" },
  { value: "3", label: "Security" },
  { value: "4", label: "Accounting" },
  { value: "9", label: "Admin" },
];

export const getUserLevelDescription = (value: number) => {
  const level = userLevels.find((lvl) => lvl.value === value);
  return level ? level.label : "UNKNOWN";
};

export const colDefs: (ColDef<User> | ColGroupDef<User>)[] = [
  {
    headerName: "Name",
    field: "username",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Last Visit",
    field: "last_visit",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Email",
    field: "email",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Level",
    field: "user_level",
    flex: 0.72,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    valueFormatter: (params) => getUserLevelDescription(params.value as number),
  },
];

export const theme = themeQuartz.withParams({
  headerHeight: 30,
  rowHeight: 26.5,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
});

export type FormInput = {
  name: string;
  title: string;
  type: string;
  data?: CustomSelectOption[];
  defaultQuery?: string;
  defaultValue?: number;
};

export const sampleCompanies: CustomSelectOption[] = [
  {
    value: 25,
    label: " Saver Group",
  },
  {
    value: 34,
    label: "AMPM",
  },
  {
    value: 12,
    label: "Another Test Company",
  },
  {
    value: 6,
    label: "Bargain Barn",
  },
  {
    value: 30,
    label: "Brooks Grocery",
  },
  {
    value: 18,
    label: "Bruces Foodland",
  },
  {
    value: 16,
    label: "C5 Inc",
  },
  {
    value: 8,
    label: "Customers",
  },
  {
    value: 1,
    label: "DCR",
  },
  {
    value: 19,
    label: "Family Health",
  },
  {
    value: 17,
    label: "Family Wash",
  },
  {
    value: 31,
    label: "Fresh Value",
  },
  {
    value: 14,
    label: "Great Lakes",
  },
  {
    value: 35,
    label: "Grocery Basket",
  },
  {
    value: 20,
    label: "HC North",
  },
  {
    value: 26,
    label: "Herman",
  },
  {
    value: 29,
    label: "Holley Oil",
  },
  {
    value: 5,
    label: "Houchens",
  },
  {
    value: 21,
    label: "Jusgo",
  },
  {
    value: 24,
    label: "Kiosk Test",
  },
  {
    value: 22,
    label: "North Country",
  },
  {
    value: 23,
    label: "Piggly Wiggly South Carolina",
  },
  {
    value: 28,
    label: "PosPlus",
  },
  {
    value: 27,
    label: "Postec",
  },
  {
    value: 15,
    label: "Rod Plus Solutions",
  },
  {
    value: 13,
    label: "RSS Grocery",
  },
  {
    value: 7,
    label: "S & C Foods",
  },
  {
    value: 32,
    label: "Sedanos",
  },
  {
    value: 33,
    label: "Shift",
  },
  {
    value: 36,
    label: "Town and Country",
  },
];

export const inputs = [
  { name: "username", title: "Username", type: "text" },
  { name: "email", title: "Email", type: "text" },
  { name: "first_name", title: "First Name", type: "text" },
  { name: "last_name", title: "Last Name", type: "text" },
  { name: "user_level", title: "User Level", type: "select", display: "label", value: "value", data: userLevels },
  {
    name: "company",
    title: "Company",
    type: "select",
    display: "name",
    value: "id",
  },
  { name: "password", title: "Password", type: "password" },
  { name: "confirm_password", title: "Confirm Password", type: "password" },
  { name: "role", title: "Role", type: "select", data: roles },
];
