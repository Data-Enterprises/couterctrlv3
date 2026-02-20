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
}

const initialState: CompanyState = {
  companies: [],
  selectedCompanyId: 0,
  selectedForm: "",
  refreshCompanies: true,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setSelectedCompanyFormId: (state, action: PayloadAction<number>) => {
      state.selectedCompanyId = action.payload;
    },
    setSelectedCompanyForm: (state, action: PayloadAction<CompanyFormType>) => {
      state.selectedForm = action.payload;
    },
    setRefreshCompanies: (state, action: PayloadAction<boolean>) => {
      state.refreshCompanies = action.payload;
    },
    resetCompanyState: () => initialState,
  },
});

export const {
  setCompanies,
  setRefreshCompanies,
  setSelectedCompanyFormId,
  setSelectedCompanyForm,
} = companySlice.actions;

export default companySlice.reducer;
