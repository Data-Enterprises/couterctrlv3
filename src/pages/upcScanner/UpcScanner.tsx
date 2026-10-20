import { useAppSelector } from "../../hooks";
import { DEV_API_URL } from "../../hooks/useDevApi";
import DevOnlyNotice from "../../components/DevOnlyNotice";
import DevUpcScanner from "./dev/UpcScanner";

/**
 * Upc Scanner is a Coming Soon page: dev only.
 *
 * It has a `pages/upcScanner/dev` tree and no prod tree until it is greenlit.
 * The page renders only when the session is on the dev API — the switch says
 * dev AND the base URL really is the dev one — so every call it makes goes to
 * dev. Anywhere else it renders DevOnlyNotice: none of the page's code runs
 * and nothing is fetched.
 *
 * Same gate and same reason as Sales Export, and it matters more here: a send
 * writes a real file that a client's tag printer picks up, which is not
 * something to reach by wandering into the section.
 */
const UpcScanner = () => {
  const { apiEnv, url } = useAppSelector((state) => state.app);
  if (apiEnv !== "dev" || url !== DEV_API_URL) return <DevOnlyNotice />;
  return <DevUpcScanner />;
};

export default UpcScanner;
