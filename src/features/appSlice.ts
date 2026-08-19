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
  /** Which API this session talks to. Independent of `devMode`. */
  apiEnv: "dev" | "prod";
  prodToken: string;
  devToken: string;
}

/**
 * Whether the LIVE/PREVIEW switch is offered in the title bars.
 *
 * Off for the cutover to the new UI: everyone runs Preview against the dev API
 * exclusively. Nothing is deleted — `toggleDevMode` and both title-bar controls
 * are intact, so flipping this back to `true` restores the switch as it was.
 */
export const SHOW_ENV_TOGGLE = false;

/**
 * The Prod/Dev API switch in the avatar dropdown.
 *
 * Separate from SHOW_ENV_TOGGLE above, and separate from `devMode`, because
 * they are three different questions. `devMode` picks the dev-vs-legacy UI --
 * 80-odd call sites, every page in DevPages -- so routing an API switch
 * through it would drop the whole app back to the legacy interface on the
 * first click. `apiEnv` picks the backend and nothing else.
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
  devMode: true,
  apiEnv: "prod",
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
    // UI fork only. It used to move url/token as well, which conflated the
    // interface someone is looking at with the backend they are pointed at;
    // setApiEnv owns that half now.
    toggleDevMode: (state) => {
      state.devMode = !state.devMode;
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
  setApiEnv,
  toggleDevMode,
  resetAppSlice,
} = appSlice.actions;

export default appSlice.reducer;
