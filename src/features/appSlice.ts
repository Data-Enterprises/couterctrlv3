import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  url: string;
  miktoUrl: string;
  apiKey: string;
  chatUrl: string;
  key: string;
  loggedIn: boolean;
  token: string;
  autoReload: boolean;
  showForgotPassword: boolean;
  scope: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  fetchingCredentials: boolean;
}

export const initialState: AppState = {
  url: "https://y9v6viv36h.execute-api.us-east-1.amazonaws.com/Prod/",
  miktoUrl: "https://goliathai.casa/",
  apiKey: "35Se0kl65Far1hT4",
  key: "7801882436271592", // for the url api if needed (above)
  loggedIn: false,
  token: "",
  autoReload: true,
  showForgotPassword: false,
  scope: 0,
  chatUrl: "http://12.96.144.112/",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  fetchingCredentials: false,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload;
    },
    setForgotPassword: (state, action: PayloadAction<boolean>) => {
      state.showForgotPassword = action.payload;
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
    setIsTablet: (state, action: PayloadAction<boolean>) => {
      state.isTablet = action.payload;
    },
    setIsDesktop: (state, action: PayloadAction<boolean>) => {
      state.isDesktop = action.payload;
    },
    setFetchingCredentials: (state, action: PayloadAction<boolean>) => {
      state.fetchingCredentials = action.payload;
    },
    resetAppSlice: () => initialState,
  },
});

export const {
  setToken,
  setLoggedIn,
  setForgotPassword,
  setIsMobile,
  setIsTablet,
  setIsDesktop,
  setFetchingCredentials,
  resetAppSlice,
} = appSlice.actions;

export default appSlice.reducer;
