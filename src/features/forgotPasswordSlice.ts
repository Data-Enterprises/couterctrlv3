import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ForgotPasswordState {
  email: string;
  username: string;
  question: string;
  answer: string;
  newPassword: string;
  confirmNewPassword: string;
  index: number;
}

export const initialState: ForgotPasswordState = {
  email: "",
  username: "",
  question: "",
  answer: "",
  newPassword: "",
  confirmNewPassword: "",
  index: 0,
};

export const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    setEmail(state, action: PayloadAction<string>) {
      state.email = action.payload;
    },
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setQuestion(state, action: PayloadAction<string>) {
      state.question = action.payload;
    },
    setAnswer(state, action: PayloadAction<string>) {
      state.answer = action.payload;
    },
    setNewPassword(state, action: PayloadAction<string>) {
      state.newPassword = action.payload;
    },
    setConfirmNewPassword(state, action: PayloadAction<string>) {
      state.confirmNewPassword = action.payload;
    },
    setIndex(state) {
      state.index += 1;
    },
    resetForgotPasswordSlice: () => initialState,
  },
});

export const {
  setEmail,
  setUsername,
  setQuestion,
  setAnswer,
  setNewPassword,
  setConfirmNewPassword,
  setIndex,
  resetForgotPasswordSlice,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
