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
  devMode: boolean;
  prodToken: string;
  devToken: string;
}

export const initialState: AppState = {
  // Check the build/deploy commands in package.json if changes are needed
  url: import.meta.env.VITE_API_URL_PROD,
  miktoUrl: import.meta.env.VITE_MIKTO_API_URL,
  // url: "https://y9v6viv36h.execute-api.us-east-1.amazonaws.com/Prod/",
  // miktoUrl: "https://goliathai.casa/",
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
  devMode: false,
  prodToken: "",
  devToken: "",
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
    setDevToken: (state, action: PayloadAction<string>) => {
      state.devToken = action.payload;
    },
    setProdToken: (state, action: PayloadAction<string>) => {
      state.prodToken = action.payload;
    },
    toggleDevMode: (state) => {
      state.devMode = !state.devMode;
      state.url   = state.devMode ? import.meta.env.VITE_API_URL_DEV  : import.meta.env.VITE_API_URL_PROD;
      state.token = state.devMode ? state.devToken : state.prodToken;
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
  setDevToken,
  setProdToken,
  toggleDevMode,
  resetAppSlice,
} = appSlice.actions;

export default appSlice.reducer;

