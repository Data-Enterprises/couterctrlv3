import type { ComponentProps } from "react";
import { useAppSelector } from "../../../hooks";
import ProdItemPerfMobile from "./prod/ItemPerfMobile";
import DevItemPerfMobile from "./dev/ItemPerfMobile";

/**
 * Which ItemPerfMobile to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/shared/itemPerf/dev`, on prod you get `pages/shared/itemPerf/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs shared/itemPerf` copies it
 * over prod and the two trees match again until the next change.
 */
const ItemPerfMobile = (props: ComponentProps<typeof ProdItemPerfMobile>) => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevItemPerfMobile {...props} /> : <ProdItemPerfMobile {...props} />;
};

export default ItemPerfMobile;
