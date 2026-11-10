// Hooks
import { useAppSelector } from "../../hooks";
import { DEV_API_URL } from "../../hooks/useDevApi";

// Components
import DevOnlyNotice from "../../components/DevOnlyNotice";
import DevMarkdowns from "./dev/Markdowns";

/** The Markdowns route: the dev page on the dev API, and the dev-only notice
 *  anywhere else (it is a Coming Soon page with no prod tree). */
const Markdowns = () => {
  const { apiEnv, url } = useAppSelector((state) => state.app);

  if (apiEnv !== 'dev' || url !== DEV_API_URL) {
    return <DevOnlyNotice />;
  }

  return <DevMarkdowns />;
};

export default Markdowns;
