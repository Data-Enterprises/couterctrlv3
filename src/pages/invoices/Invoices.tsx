import { useAppSelector } from "../../hooks";
import { DEV_API_URL } from "../../hooks/useDevApi";
import DevOnlyNotice from "../../components/DevOnlyNotice";
import DevInvoices from "./dev/Invoices";

/**
 * Invoices is a Coming Soon page: dev only.
 *
 * It has a `pages/invoices/dev` tree and no prod tree until it is greenlit. The
 * page renders only when the session is on the dev API — `apiEnv` is "dev"
 * AND the base URL really is the dev one, so every call it makes goes to
 * dev. Anywhere else (the prod API, which is what clients see) it renders
 * DevOnlyNotice: none of the page's code runs and nothing is fetched.
 */
const Invoices = () => {
  const { apiEnv, url } = useAppSelector((state) => state.app);
  if (apiEnv !== "dev" || url !== DEV_API_URL) return <DevOnlyNotice />;
  return <DevInvoices />;
};

export default Invoices;
