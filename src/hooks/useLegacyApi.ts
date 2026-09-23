import { useAppSelector } from ".";

// The legacy API base, read straight from the environment — the mirror of
// useDevApi. Legacy pages are pinned to it by construction: `src/legacy/hooks`
// swaps it into the `app.url` those pages read, so a restored page cannot end
// up calling dev or prod because of which environment the user is browsing.
export const LEGACY_API_URL = import.meta.env.VITE_API_URL_LEGACY;

// The credential travels with the base URL. Legacy is its own backend, so it
// issues its own token — sign-in fetches it alongside dev's and prod's, and
// carrying a prod token to this host would just 401.
export const useLegacyApi = () => {
  const legacyToken = useAppSelector((state) => state.app.legacyToken);
  return { url: LEGACY_API_URL, token: legacyToken };
};
