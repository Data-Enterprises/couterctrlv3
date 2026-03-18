import { themeQuartz } from "ag-grid-community";

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

export const roles: CustomSelectOption[] = [
  { value: "1", label: "Single Store" },
  { value: "2", label: "Multi Store" },
  { value: "3", label: "Security" },
  { value: "4", label: "Accounting" },
  { value: "9", label: "Admin" },
];

export const theme = themeQuartz.withParams({
  headerHeight: 30,
  rowHeight: 26,
  headerBackgroundColor: "#1e2d50",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#afb0b3",
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
  { name: "first_name", title: "First Name", type: "text" },
  { name: "last_name", title: "Last Name", type: "text" },
  {
    name: "user_level",
    title: "User Level",
    type: "select",
  },
  { name: "role", title: "Role", type: "select", data: roles },
  { name: "password", title: "Password", type: "password" },
  { name: "confirm_password", title: "Confirm Password", type: "password" },
];
