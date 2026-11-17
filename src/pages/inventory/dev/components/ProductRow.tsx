// Utils
import { treeMoney } from "../utils";

// Interfaces
import type { ProductSummary } from "../interfaces";

interface ProductRowProps {
  product: ProductSummary;
  isSelected: boolean;
  onSelect: () => void;
}

/** One item inside the open group: its description and sales. */
const ProductRow = ({ product, isSelected, onSelect }: ProductRowProps) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left border-l-2 transition-colors ${
      isSelected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
  >
    <span
      className={`flex-1 min-w-0 truncate text-[12.5px] ${
        isSelected ? "text-content font-medium" : "text-content"
      }`}
    >
      {product.description}
    </span>
    <span
      className={`text-[11px] tabular-nums flex-shrink-0 ${
        isSelected ? "text-content" : "text-content/95"
      }`}
    >
      {treeMoney(product.sales)}
    </span>
  </button>
);

export default ProductRow;
