import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "../interfaces";

interface OrganizationState {
  companies: Company[];
  refresh: boolean;
}

const initialState: OrganizationState = {
  companies: [],
  refresh: true,
};

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    resetOrganizationState: () => initialState,
  },
});

export const { setCompanies, setRefresh, resetOrganizationState } =
  organizationSlice.actions;
export default organizationSlice.reducer;
