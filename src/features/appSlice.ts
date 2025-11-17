import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  url: string;
  chatUrl: string;
  key: string;
  loggedIn: boolean;
  token: string;
  isLoading: boolean;
  autoReload: boolean;
  showForgotPassword: boolean;
  scope: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const initialState: AppState = {
  url: "https://y9v6viv36h.execute-api.us-east-1.amazonaws.com/Prod/",
  key: "7801882436271592", // for the url api if needed (above)
  loggedIn: false,
  token: "",
  isLoading: false,
  autoReload: true,
  showForgotPassword: false,
  scope: 0,
  chatUrl: "http://12.96.144.112/",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
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
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setForgotPassword: (state, action: PayloadAction<boolean>) => {
      state.showForgotPassword = action.payload;
    },
    logout: (state) => {
      state.loggedIn = false;
      state.token = "";
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
    handleSigningOut: () => initialState,
  },
});

export const {
  setToken,
  setLoggedIn,
  logout,
  setIsLoading,
  setForgotPassword,
  setIsMobile,
  setIsTablet,
  setIsDesktop,
  handleSigningOut,
} = appSlice.actions;

export default appSlice.reducer;
