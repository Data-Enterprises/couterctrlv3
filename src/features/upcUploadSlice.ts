import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UpcUploadState {
  upcs: string[];
  upcText: string;
  fileName: string;
}

const initialState: UpcUploadState = {
  upcs: [],
  upcText: "",
  fileName: "",
};

export const upcUploadSlice = createSlice({
  name: "upcUpload",
  initialState,
  reducers: {
    setUpcs: (state, action: PayloadAction<string[]>) => {
      if (action.payload.length === 0) {
        state.upcs = [];
        state.upcText = "";
        return;
      }

      // const filtered = action.payload.filter((upc) =>)
      const reduced = action.payload.reduce((acc: string[], curr: string) => {
        if (!acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      const allUpcs = [...state.upcs, ...reduced];
      const finalReduced = allUpcs.reduce((acc: string[], curr: string) => {
        if (!acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      state.upcs = finalReduced;
      state.upcText = "";
    },
    setUpcText: (state, action: PayloadAction<string>) => {
      state.upcText = action.payload;
    },
    setUpcFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    removeSingleUpc: (state, action: PayloadAction<string>) => {
      state.upcs = state.upcs.filter((upc) => upc !== action.payload);
    },
    clearUpcs: (state) => {
      state.upcs = [];
      state.upcText = "";
      state.fileName = "";
    },
    resetUpcsSlice: () => initialState,
  },
});

export const {
  setUpcs,
  setUpcText,
  setUpcFileName,
  removeSingleUpc,
  clearUpcs,
  resetUpcsSlice,
} = upcUploadSlice.actions;
export default upcUploadSlice.reducer;
