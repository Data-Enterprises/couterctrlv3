import { useAppSelector } from "../../hooks";
import ProdForecasting from "./prod/Forecasting";
import DevForecasting from "./dev/Forecasting";

/**
 * Which Forecasting to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/forecast/dev`, on prod you get `pages/forecast/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs forecast` copies it
 * over prod and the two trees match again until the next change.
 */
const Forecasting = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevForecasting /> : <ProdForecasting />;
};

export default Forecasting;
