import { useAppSelector } from ".";

// The prod API base, read straight from the environment rather than from
// appSlice.url — the mirror of useDevApi. Legacy pages are pinned to prod by
// construction: the toggle forces `apiEnv` to prod on the way in, and taking
// the base from here means a legacy page still can't reach dev if that ever
// stops being true.
export const PROD_API_URL = import.meta.env.VITE_API_URL_PROD;

// url and token travel as a pair: appSlice swaps both together on setApiEnv,
// so pointing at the prod host while carrying the dev token just 401s.
export const useProdApi = () => {
  const prodToken = useAppSelector((state) => state.app.prodToken);
  return { url: PROD_API_URL, token: prodToken };
};
