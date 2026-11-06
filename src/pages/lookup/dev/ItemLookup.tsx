// Hooks
import { useAppSelector } from "../../../hooks";

// Components
import ItemLookupMobile from "./mobile/ItemLookupMobile";
import ItemLookupDesktop from "./desktop/ItemLookupDesktop";

const ItemLookup = () => {
  const isMobile = useAppSelector((s) => s.app.isMobile);
  return isMobile ? <ItemLookupMobile /> : <ItemLookupDesktop />;
};

export default ItemLookup;
