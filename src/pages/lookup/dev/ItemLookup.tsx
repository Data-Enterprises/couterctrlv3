// Hooks
import { useAppSelector } from "../../../hooks";

// Components
import ItemLookupMobile from "./mobile/ItemLookupMobile";
import ItemLookupDesktop from "./desktop/ItemLookupDesktop";

/** The Item lookup page: the phone screens on a phone, the desktop layout otherwise. */
const ItemLookup = () => {
  const isMobile = useAppSelector((s) => s.app.isMobile);
  return isMobile ? <ItemLookupMobile /> : <ItemLookupDesktop />;
};

export default ItemLookup;
