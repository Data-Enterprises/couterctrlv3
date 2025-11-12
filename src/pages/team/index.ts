import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { User } from "../../interfaces";

export const roles = [
  { value: "1", label: "Single Store" },
  { value: "2", label: "Multi Store" },
  { value: "3", label: "Security" },
  { value: "4", label: "Accounting" },
  { value: "9", label: "Admin" },
];

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

export const userLevels = [
  { levelId: 1, levelDescription: "USER" },
  { levelId: 2, levelDescription: "TECH" },
  { levelId: 3, levelDescription: "STORE MANAGER" },
  { levelId: 4, levelDescription: "HELP DESK" },
  { levelId: 5, levelDescription: "HELP DESK MANAGEMENT" },
  { levelId: 6, levelDescription: "POWER USER" },
  { levelId: 7, levelDescription: "OWNER" },
  { levelId: 8, levelDescription: "ADMIN" },
  { levelId: 9, levelDescription: "PROGRAMMER" },
];

export const getUserLevelDescription = (levelId: number) => {
  const level = userLevels.find((lvl) => lvl.levelId === levelId);
  return level ? level.levelDescription : "UNKNOWN";
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
