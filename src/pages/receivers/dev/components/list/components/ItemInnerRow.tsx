// Interfaces
import type { ReceiverListItem } from "../../../../../../interfaces";

interface ItemInnerRowProps {
  isSel: boolean;
  item: ReceiverListItem;
  getDetails: () => void;
}

/** One invoice row in the receiver list: invoice number, item count and vendor, highlighted when selected. */
const ItemInnerRow = ({ item, getDetails, isSel }: ItemInnerRowProps) => {
  return (
    <button
      onClick={getDetails}
      className={`w-full grid grid-cols-[60px_70px_1fr] items-center gap-2 pl-6 pr-3 py-2 text-left transition-colors ${
        isSel ? "bg-custom-white" : "hover:bg-gray-50"
      }`}
      style={
        isSel
          ? {
              boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)",
            }
          : undefined
      }
    >
      <span className="text-[12px] text-content">{item.invoiceid}</span>
      <span className="text-[12px] text-content">{item.items}</span>
      <span className="text-[12px] text-content truncate">
        {item.vendor_name}
      </span>
    </button>
  );
};

export default ItemInnerRow;
