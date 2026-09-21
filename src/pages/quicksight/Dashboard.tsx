import { useAppSelector } from "../../hooks";
import ProdDashboard from "./prod/Dashboard";
import DevDashboard from "./dev/Dashboard";

/**
 * Which Dashboard to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/quicksight/dev`, on prod you get `pages/quicksight/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs quicksight` copies it
 * over prod and the two trees match again until the next change.
 */
const Dashboard = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevDashboard /> : <ProdDashboard />;
};

export default Dashboard;
