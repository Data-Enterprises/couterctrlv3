import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UpcUploadState {
  upcs: string[];
  upcText: string;
}

const initialState: UpcUploadState = {
  upcs: [],
  upcText: "",
};

export const upcUploadSlice = createSlice({
  name: "upcUpload",
  initialState,
  reducers: {
    setUpcs: (state, action: PayloadAction<string[]>) => {
      if (action.payload.length === 0) state.upcs = [];

      // const filtered = action.payload.filter((upc) =>)
      const reduced = action.payload.reduce((acc: string[], curr: string) => {
        if (!acc.includes(curr)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      state.upcs = reduced;
      state.upcText = "";
    },
    setUpcText: (state, action: PayloadAction<string>) => {
      state.upcText = action.payload;
    },
    removeSingleUpc: (state, action: PayloadAction<string>) => {
      state.upcs = state.upcs.filter((upc) => upc !== action.payload);
    },
    clearUpcs: (state) => {
      state.upcs = [];
      state.upcText = "";
    },
  },
});

export const { setUpcs, setUpcText, removeSingleUpc, clearUpcs } =
  upcUploadSlice.actions;
export default upcUploadSlice.reducer;
