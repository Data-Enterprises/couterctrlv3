import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface QuickSightState {
  embedUrl: string;
}

const initialState: QuickSightState = {
  embedUrl: "",
};

const quickSightSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setEmbedUrl: (state, action: PayloadAction<string>) => {
      state.embedUrl = action.payload;
    },
  },
});

export const { setEmbedUrl } = quickSightSlice.actions;
export default quickSightSlice.reducer;
