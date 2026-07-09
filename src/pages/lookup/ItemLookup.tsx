import { useAppSelector } from "../../hooks";
import ItemLookupDev from "./dev/ItemLookupDev";
import ItemLookupDesktop from "./dev/desktop/ItemLookupDesktop";

const ItemLookup = () => {
  const isMobile = useAppSelector((s) => s.app.isMobile);
  return isMobile ? <ItemLookupDev /> : <ItemLookupDesktop />;
};

export default ItemLookup;
