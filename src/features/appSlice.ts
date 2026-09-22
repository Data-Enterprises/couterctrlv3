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
  /** Which API this session talks to — and so which UI tree each page renders. */
  apiEnv: "dev" | "prod";
  /**
   * Live is the app as published. Legacy is the pages the dev/prod separation
   * replaced, kept for people who still need the old view of the data.
   *
   * It sits beside `apiEnv` rather than inside it because it answers a
   * different question — which generation of the page, not which backend —
   * and the two are not free to combine: legacy is prod-only.
   */
  uiMode: "live" | "legacy";
  prodToken: string;
  devToken: string;
}

/**
 * The Prod/Dev API switch in the avatar dropdown.
 *
 * `apiEnv` picks the backend, and with it the UI tree: every split page shows
 * its dev tree on the dev API and its prod tree on prod, and Coming Soon pages
 * exist on the dev API only.
 *
 * Also gates the cross-environment sign-in in Login: the switch is a pointer
 * swap between two already-held tokens, so both have to be fetched up front
 * or flipping lands on an empty string and 401s.
 */
export const SHOW_API_ENV_SWITCH = true;

export const initialState: AppState = {
  // Check the build/deploy commands in package.json if changes are needed
  // Prod on load; the avatar dropdown switches it. Must stay in step with
  // `apiEnv` below -- `setApiEnv` is what keeps url/token/apiEnv aligned
  // thereafter.
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
  apiEnv: "prod",
  uiMode: "live",
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
    setApiEnv: (state, action: PayloadAction<"dev" | "prod">) => {
      state.apiEnv = action.payload;
      state.url =
        action.payload === "dev"
          ? import.meta.env.VITE_API_URL_DEV
          : import.meta.env.VITE_API_URL_PROD;
      // Tokens are issued per environment -- a dev JWT is rejected by prod --
      // so the credential has to travel with the base URL.
      state.token = action.payload === "dev" ? state.devToken : state.prodToken;
    },
    /**
     * Live <-> Legacy.
     *
     * Either direction lands on the prod API. Legacy pages read prod by
     * construction and coming back out of Legacy on the dev API would drop the
     * user somewhere they didn't ask to be, so the switch ends in prod both
     * ways and the Mode row is disabled while Legacy is on.
     */
    setUiMode: (state, action: PayloadAction<"live" | "legacy">) => {
      state.uiMode = action.payload;
      state.apiEnv = "prod";
      state.url = import.meta.env.VITE_API_URL_PROD;
      state.token = state.prodToken;
    },
    resetAppSlice: () => initialState,
  },
});

export const {
  setUiMode,
  setToken,
  setLoggedIn,
  setForgotPassword,
  setIsMobile,
  setIsTablet,
  setIsDesktop,
  setFetchingCredentials,
  setDevToken,
  setProdToken,
  setApiEnv,
  resetAppSlice,
} = appSlice.actions;

export default appSlice.reducer;
