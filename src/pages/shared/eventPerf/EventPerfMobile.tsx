import type { ComponentProps } from "react";
import { useAppSelector } from "../../../hooks";
import ProdEventPerfMobile from "./prod/EventPerfMobile";
import DevEventPerfMobile from "./dev/EventPerfMobile";

/**
 * Which EventPerfMobile to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/shared/eventPerf/dev`, on prod you get `pages/shared/eventPerf/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs shared/eventPerf` copies it
 * over prod and the two trees match again until the next change.
 */
const EventPerfMobile = (props: ComponentProps<typeof ProdEventPerfMobile>) => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevEventPerfMobile {...props} /> : <ProdEventPerfMobile {...props} />;
};

export default EventPerfMobile;
