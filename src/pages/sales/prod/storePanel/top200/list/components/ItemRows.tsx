// Hooks
import { useSalesCtx } from "../../../../hooks";
import { useTop200View } from "../../hooks";

// Utils
import {
  pointsFor,
  topItemInsight,
  type TopItemCompared,
} from "../../utils/topItems";

// Components
import ItemRow from "./ItemRow";

interface ItemRowsProps {
  shown: TopItemCompared[];
}

/** The ranked list's rows. */
const ItemRows = ({ shown }: ItemRowsProps) => {
  const { itemThreshold, topItemPoints } = useSalesCtx();
  const { selectedCode, setSelectedCode } = useTop200View();
  /** The page's grading threshold, so these pills grade like every other. */
  const threshold = itemThreshold ?? 9;

  return (
    <div className="overflow-y-auto thin-scrollbar flex-1">
      {shown.map((r) => {
        const isSel = selectedCode === r.ty.product_code;
        return (
          <ItemRow
            key={r.ty.product_code}
            row={r}
            tone={
              topItemInsight(r.ty, pointsFor(topItemPoints, r.ty.product_code))
                .tone
            }
            selected={isSel}
            threshold={threshold}
            onToggle={() => setSelectedCode(isSel ? null : r.ty.product_code)}
          />
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
