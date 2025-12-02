import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ClipboardText } from "../interfaces";

type Position = { x: number; y: number } | null;

interface ContextMenuState {
  menuPosition: Position;
  clipboardText: ClipboardText;
}

const initialState: ContextMenuState = {
  menuPosition: null,
  clipboardText: { upc: "", desc: "" },
};

const ctxMenuSlice = createSlice({
  name: "contextMenu",
  initialState,
  reducers: {
    setMenuPosition: (state, action: PayloadAction<Position>) => {
      state.menuPosition = action.payload;
    },
    setClipboardText: (state, action: PayloadAction<ClipboardText>) => {
      state.clipboardText = action.payload;
    },
  },
});

export const { setMenuPosition, setClipboardText } = ctxMenuSlice.actions;

export default ctxMenuSlice.reducer;
