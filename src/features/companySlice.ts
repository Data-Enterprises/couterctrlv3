import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "../interfaces";

interface CompanyState {
  companies: Company[];
  selectedCompanyId: number;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompanyId: 0,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setSelectedCompanyId: (state, action: PayloadAction<number>) => {
      state.selectedCompanyId = action.payload;
    },
    resetCompanyState: () => initialState,
  },
});

export const { setCompanies, setSelectedCompanyId } = companySlice.actions;
export default companySlice.reducer;
