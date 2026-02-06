import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface RptOption {
  weekly: boolean;
  hourly: boolean;
  subDept: boolean;
}

interface InitialState {
  isOpen: boolean;
  title: string;
  options: RptOption;
}

const initialState: InitialState = {
  isOpen: false,
  title: "Weekly Sales",
  options: {
    weekly: true,
    hourly: false,
    subDept: false,
  },
};

const reportBuilderSlice = createSlice({
  name: "reportBuilder",
  initialState,
  reducers: {
    setIsRptOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    setOptions: (state, action: PayloadAction<RptOption>) => {
      state.options = action.payload;
      if (action.payload.weekly) {
        state.title = "Weekly Sales";
      } else if (action.payload.hourly) {
        state.title = "Hourly Sales";
      } else if (action.payload.subDept) {
        state.title = "Sub Dept Sales";
      }
    },
  },
});

export const { setIsRptOpen, setTitle, setOptions } =
  reportBuilderSlice.actions;
export default reportBuilderSlice.reducer;
