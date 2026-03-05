import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ClipboardText, SMClipboardText } from "../interfaces";

type Position = { x: number; y: number } | null;

interface ContextMenuState {
  menuPosition: Position;
  clipboardText: ClipboardText;
  smClipboardText: SMClipboardText;
}

const initialState: ContextMenuState = {
  menuPosition: null,
  clipboardText: { upc: "", desc: "" },
  smClipboardText: { upc: "", allUpc: "" },
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
    setSMClipboardText: (state, action: PayloadAction<SMClipboardText>) => {
      state.smClipboardText = action.payload;
    },
  },
});

export const { setMenuPosition, setClipboardText, setSMClipboardText } =
  ctxMenuSlice.actions;

export default ctxMenuSlice.reducer;
