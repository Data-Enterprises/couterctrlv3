import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ItemScanState {
  upcCode: string;
  pause: boolean;
  deviceId: string;
  error: string;
}

const initialState: ItemScanState = {
  upcCode: "",
  pause: true,
  deviceId: "",
  error: "",
};

const itemScanSlice = createSlice({
  name: "itemScan",
  initialState,
  reducers: {
    setUpcCode: (state, action: PayloadAction<string>) => {
      state.upcCode = action.payload;
    },
    setPause: (state, action: PayloadAction<boolean>) => {
      state.pause = action.payload;
    },
    setDeviceId: (state, action: PayloadAction<string>) => {
      state.deviceId = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setUpcCode, setPause, setDeviceId, setError } =
  itemScanSlice.actions;
export default itemScanSlice.reducer;
