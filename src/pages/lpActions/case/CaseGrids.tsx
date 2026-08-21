import CaseItems from "./CaseItems";
import CaseReceipts from "./CaseReceipts";
import { isAll } from "./caseModel";
import type { ItemRow } from "./itemMovement";
import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * What was rung, beside what it was rung on.
 *
 * Side by side rather than stacked because they answer one question between
 * them: an item that appears in the left list and a receipt in the right one
 * are the same event seen two ways, and a reader checking one against the
 * other should not have to scroll to do it.
 */
interface Props {
  items: ItemRow[];
  itemsLoading: boolean;
  itemsError: string | null;
  showAllItems: boolean;
  onToggleItems: () => void;
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  saleType: string;
  onOpenReceipt: (row: CashierTransaction) => void;
}

const CaseGrids = ({
  items,
  itemsLoading,
  itemsError,
  showAllItems,
  onToggleItems,
  rows,
  lines,
  saleType,
  onOpenReceipt,
}: Props) => (
  <div className="grid grid-cols-2 border-t border-gray-100">
    <div className="min-w-0 border-r border-gray-100">
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-content/85">
        {isAll(saleType) ? "Items" : `${saleType} items`}
      </div>
      <CaseItems
        items={items}
        loading={itemsLoading}
        error={itemsError}
        showAll={showAllItems}
        onToggleAll={onToggleItems}
      />
    </div>

    <div className="min-w-0">
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-content/85">
        Largest receipts
      </div>
      <CaseReceipts
        rows={rows}
        lines={lines}
        saleType={saleType}
        onOpen={onOpenReceipt}
      />
    </div>
  </div>
);

export default CaseGrids;
