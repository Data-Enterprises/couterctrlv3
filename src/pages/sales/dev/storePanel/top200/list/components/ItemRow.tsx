// Utils
import { pillClass } from "../../../../../../../utils/severity";
import {
  amountText,
  deptName,
  type ItemInsight,
  type TopItemCompared,
} from "../../utils/topItems";
import { dotClass, moneyText, pctText } from "../../utils";

interface ItemRowProps {
  row: TopItemCompared;
  tone: ItemInsight["tone"];
  selected: boolean;
  /** The page's grading threshold, so the pills grade like every other. */
  threshold: number;
  /** Open this item, or close it when it is already open. */
  onToggle: () => void;
}

/** One ranked item: its dot, name, code and department, sales, and the two
 *  change pills. Clicking it opens the item; clicking it again closes it. */
const ItemRow = ({
  row: r,
  tone,
  selected,
  threshold,
  onToggle,
}: ItemRowProps) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
      selected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
  >
    <span
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass(tone)}`}
    />
    <span className="flex-1 min-w-0">
      <span
        className="block text-[12px] font-medium text-content truncate"
        title={r.ty.product_description}
      >
        {r.ty.product_description}
      </span>
      <span
        className="block text-[10.5px] text-content/95 tabular-nums truncate"
        title={`${r.ty.product_code} · ${deptName(r.ty)} · ${amountText(r.ty)}`}
      >
        <span className="font-semibold">{r.ty.product_code}</span> ·{" "}
        <span className="font-semibold">{deptName(r.ty)}</span>
      </span>
    </span>
    <span className="w-[68px] text-right text-[12px] font-semibold text-content tabular-nums flex-shrink-0 pl-2.5">
      {moneyText(r.ty.total_sales)}
    </span>
    <span
      className={`w-[56px] flex-shrink-0 text-center text-[12px] font-semibold px-1.5 py-1 rounded whitespace-nowrap ${pillClass(r.vsLW, threshold)}`}
    >
      {pctText(r.vsLW)}
    </span>
    <span
      className={`w-[56px] flex-shrink-0 text-center text-[12px] font-semibold px-1.5 py-1 rounded whitespace-nowrap ${pillClass(r.vsLY, threshold)}`}
    >
      {pctText(r.vsLY)}
    </span>
  </button>
);

export default ItemRow;
