export type SelectOption = {
  value: number | string;
  label: string;
};

export const roles: SelectOption[] = [
  { value: "1", label: "Single Store" },
  { value: "2", label: "Multi Store" },
  { value: "3", label: "Security" },
  { value: "4", label: "Accounting" },
  { value: "9", label: "Admin" },
];
