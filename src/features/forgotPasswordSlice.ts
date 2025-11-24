import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ForgotPasswordState {
  email: string;
  username: string;
  question: string;
  answer: string;
  newPassword: string;
  index: number;
}

export const initialState: ForgotPasswordState = {
  email: "",
  username: "",
  question: "",
  answer: "",
  newPassword: "",
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
    setIndex(state) {
      state.index += 1;
    },
    resetForgotPasswordState: () => initialState,
  },
});

export const {
  setEmail,
  setUsername,
  setQuestion,
  setAnswer,
  setNewPassword,
  setIndex,
  resetForgotPasswordState,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
