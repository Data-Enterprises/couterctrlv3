// Hooks
import { useSalesCtx } from "../../../hooks";

// Utils
import { pillClass } from "../../../../../../utils/severity";
import {
  amountText,
  deptName,
  pointsFor,
  topItemInsight,
  type TopItemCompared,
} from "../utils/topItems";
import { dotClass, moneyText, pctText } from "../utils";

// Interfaces
import type { TopItemPricePoint } from "../../../../../../api/topItems";

interface ItemRowsProps {
  shown: TopItemCompared[];
  topItemPoints: TopItemPricePoint[];
  selectedCode: string | null;
  setSelectedCode: (code: string | null) => void;
}

/** The ranked list's rows. */
const ItemRows = ({ shown, topItemPoints, selectedCode, setSelectedCode }: ItemRowsProps) => {
  /** The page's grading threshold, so these pills grade like every other. */
  const threshold = useSalesCtx().itemThreshold ?? 9;

  return (
    <div className="overflow-y-auto thin-scrollbar flex-1">
      {shown.map((r) => {
        const tone = topItemInsight(
          r.ty,
          pointsFor(topItemPoints, r.ty.product_code),
        ).tone;
        const isSel = selectedCode === r.ty.product_code;
        return (
          <button
            key={r.ty.product_code}
            onClick={() =>
              setSelectedCode(isSel ? null : r.ty.product_code)
            }
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
              isSel
                ? "bg-row_selected border-row_selected_border"
                : "border-transparent hover:bg-fill_soft"
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
                <span className="font-semibold">{r.ty.product_code}</span>{" "}
                · <span className="font-semibold">{deptName(r.ty)}</span>
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
      })}
      {shown.length === 0 && (
        <div className="flex items-center justify-center py-8 text-[12px] text-content">
          Nothing matches that search
        </div>
      )}
    </div>
  );
};

export default ItemRows;
