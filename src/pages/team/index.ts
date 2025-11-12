import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { User } from "../../interfaces";

export const formData = {
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

export const inputs = [
  { name: "username", title: "Username", type: "text" },
  { name: "email", title: "Email", type: "text" },
  { name: "firstName", title: "First Name", type: "text" },
  { name: "lastName", title: "Last Name", type: "text" },
  { name: "user_level", title: "User Level", type: "select", data: userLevels },
  { name: "company", title: "Company", type: "select", data: [] },
  { name: "password", title: "Password", type: "text" },
  { name: "confirmPassword", title: "Confirm Password", type: "text" },
  { name: "role", title: "Role", type: "select", data: roles },
];
