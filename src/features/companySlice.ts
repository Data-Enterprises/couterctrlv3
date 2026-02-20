import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "../interfaces";

export type CompanyFormType =
  | "create"
  | "update"
  | "delete"
  | "assign_to_user"
  | "";

interface CompanyState {
  companies: Company[];
  selectedCompanyId: number;
  selectedForm: CompanyFormType;
  refreshCompanies: boolean;
  companyInfo: Company;
}

const defaultInfo = {
  id: 0,
  name: "",
  address: "",
  city: "",
  state: "",
  zip: 0,
  phone: "",
  contact_email: "",
};

const initialState: CompanyState = {
  companies: [],
  selectedCompanyId: 0,
  selectedForm: "",
  refreshCompanies: true,
  companyInfo: defaultInfo,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setCompanyInfo: (
      state,
      action: PayloadAction<{ key: keyof Company; val: string }>,
    ) => {
      const { key, val } = action.payload;

      if (key === "zip") {
        state.companyInfo.zip = Number(val);
      } else if (key !== "id") {
        state.companyInfo[key] = val;
      }
    },
    setSelectedCompanyFormId: (state, action: PayloadAction<number>) => {
      const company = [...state.companies].filter(
        (c) => c.id === action.payload,
      );
      state.companyInfo = company[0];
      state.selectedCompanyId = action.payload;
    },
    setSelectedCompanyForm: (state, action: PayloadAction<CompanyFormType>) => {
      state.selectedForm = action.payload;
    },
    setRefreshCompanies: (state, action: PayloadAction<boolean>) => {
      state.refreshCompanies = action.payload;
    },
    resetCompanyInfo: (state) => {
      state.selectedCompanyId = 0;
      state.companyInfo = defaultInfo;
    },
    resetSelectedCompanyFormId: (state) => {
      state.companyInfo = defaultInfo;
      state.selectedCompanyId = 0;
    },
    resetCompanyState: () => initialState,
  },
});

export const {
  setCompanies,
  setCompanyInfo,
  setRefreshCompanies,
  setSelectedCompanyFormId,
  setSelectedCompanyForm,
  resetCompanyInfo,
  resetCompanyState,
} = companySlice.actions;

export default companySlice.reducer;
