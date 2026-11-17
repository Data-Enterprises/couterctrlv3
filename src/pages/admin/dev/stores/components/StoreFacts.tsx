// Interfaces
import type { Store } from "../../../../../interfaces";

interface StoreFactsProps {
  store: Store;
}

/** A store's ID, number and company over the rename box: context, not
 *  fields, since the backend offers no way to change either. */
const StoreFacts = ({ store }: StoreFactsProps) => (
  <div className="rounded-md bg-bkg px-3 py-2 flex items-baseline gap-3">
    <span className="text-[12px] text-content/95">
      ID <span className="font-semibold text-content">{store.storeid}</span>
    </span>
    <span className="text-[12px] text-content/95">
      Number{" "}
      <span className="font-semibold text-content">{store.store_number}</span>
    </span>
    <span className="text-[12px] text-content/95 truncate">
      Company{" "}
      <span className="font-semibold text-content">{store.company_name}</span>
    </span>
  </div>
);

export default StoreFacts;
