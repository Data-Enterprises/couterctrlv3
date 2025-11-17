import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ForgotPasswordState {
  email: string;
  username: string;
  question: string;
  answer: string;
  newPassword: string;
}

export const initialState: ForgotPasswordState = {
  email: "",
  username: "",
  question: "",
  answer: "",
  newPassword: "",
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
    resetForgotPasswordState: () => initialState,
  },
});

export const {
  setEmail,
  setUsername,
  setQuestion,
  setAnswer,
  setNewPassword,
  resetForgotPasswordState,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
