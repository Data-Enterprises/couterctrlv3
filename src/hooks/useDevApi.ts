import { useAppSelector } from ".";

// The dev API base, read straight from the environment rather than from
// appSlice.url — appSlice.url follows the devMode toggle, and these calls have
// to land on dev regardless of which environment the user is browsing, or the
// change doesn't persist where it's needed.
export const DEV_API_URL = import.meta.env.VITE_API_URL_DEV;

// url and token travel as a pair: appSlice swaps both together on
// toggleDevMode, so pointing at the dev host while carrying the prod token
// just 401s. Anything that needs pinning to dev should take both from here.
export const useDevApi = () => {
  const devToken = useAppSelector((state) => state.app.devToken);
  return { url: DEV_API_URL, token: devToken };
};
