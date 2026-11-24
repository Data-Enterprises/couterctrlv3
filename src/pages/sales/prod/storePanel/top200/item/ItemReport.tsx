// Hooks
import { useMemo } from "react";
import { useSalesCtx } from "../../../hooks";
import { useSelectedItem, useTop200View } from "../hooks";

// API
import { TOP_ITEMS_SHOWN } from "../../../../../../api/topItems";

// Utils
import {
  displayVerdict,
  marginAt,
  rankHistory,
  rankIn,
  retailMix,
  topItemsTotals,
  topPriceOf,
  unitCost,
  type TopItemCompared,
} from "../utils/topItems";
import { pctText } from "../utils";

// Components
import InvoicesButton from "./components/InvoicesButton";
import ItemBuyCost from "./components/ItemBuyCost";
import ItemCost from "./components/ItemCost";
import ItemDisplay from "./components/ItemDisplay";
import ItemHistory from "./components/ItemHistory";
import ItemIdentity from "./components/ItemIdentity";
import ItemRetail from "./components/ItemRetail";

interface ItemReportProps {
  ranked: TopItemCompared[];
  /** The picked day or "This week", as the history heading names it. */
  periodLabel: string;
  setInvoicesOpen: (open: boolean) => void;
}

/** The picked item's report, scrolling as one: who it is, how retail sold it,
 *  its cost, what it costs to buy, whether it is new to the list, whether it
 *  belongs on display, and the way into its invoices. */
const ItemReport = ({
  ranked,
  periodLabel,
  setInvoicesOpen,
}: ItemReportProps) => {
  const { topItemsLW, topItemsLY } = useSalesCtx();
  const { detail, detailLoading } = useTop200View();
  const { selected, points } = useSelectedItem(ranked);

  const totals = useMemo(() => topItemsTotals(ranked), [ranked]);

  /** Where it sits in the list, and how much of the list it is. */
  const rank = selected
    ? ranked.findIndex((r) => r.ty.product_code === selected.ty.product_code) +
      1
    : 0;
  const shareOfTop =
    selected && totals.ty > 0
      ? (selected.ty.total_sales / totals.ty) * 100
      : null;

  const perUnitCost = selected ? unitCost(selected.ty) : null;

  /** What kind of retail sold it, this week's rank history, and whether it
   *  is worth a display. All of it off rows already in hand. */
  const mix = useMemo(
    () => (selected ? retailMix(selected.ty) : null),
    [selected],
  );
  const topPrice = useMemo(() => topPriceOf(points), [points]);
  const topMargin = useMemo(
    () => marginAt(topPrice, perUnitCost),
    [topPrice, perUnitCost],
  );

  const history = useMemo(() => {
    if (!selected) return rankHistory(null, null, null);
    const code = selected.ty.product_code;
    return rankHistory(
      rank || null,
      rankIn(topItemsLW, code, TOP_ITEMS_SHOWN),
      rankIn(topItemsLY, code, TOP_ITEMS_SHOWN),
    );
  }, [selected, rank, topItemsLW, topItemsLY]);

  const display = useMemo(
    () =>
      selected
        ? displayVerdict(
            rank || null,
            selected.ty.margin,
            selected.vsLW,
            !selected.lw,
            pctText,
          )
        : displayVerdict(null, null, null, false, pctText),
    [selected, rank],
  );

  if (!selected) return null;

  return (
    /* The whole report scrolls as one. The sections below answer different
       questions and a reader works down them; pinning the top three and
       scrolling the rest only moved the seam. */
    <div className="cc-scroll">
      {/* Identity, and how much of the list this is. Contribution sits here
          rather than in a tile of its own: the figure, the money and the bar
          fit on one line, and a third tile would have cost a quarter of the
          panel. */}
      <ItemIdentity
        selected={selected}
        rank={rank}
        count={ranked.length}
        shareOfTop={shareOfTop}
      />

      {/* 1 — what retail is actually selling it. First because "all on ad at
          $11.99" explains a negative margin far more often than the cost
          does. */}
      <ItemRetail
        selected={selected}
        mix={mix}
        points={points}
        topPrice={topPrice}
      />

      {/* 2 — is the cost and the retail right. */}
      <ItemCost
        selected={selected}
        points={points}
        mix={mix}
        detail={detail}
        perUnitCost={perUnitCost}
        topPrice={topPrice}
        topMargin={topMargin}
      />

      {/* What it costs to buy, with the cost it compares against directly
          above it. */}
      <ItemBuyCost detail={detail} detailLoading={detailLoading} />

      {/* 3 — is any of this new. An item that has sat at #40 all year is a
          different conversation from one that arrived this week, and that has
          to be said before anybody reads the margin above. */}
      <ItemHistory
        history={history}
        periodLabel={periodLabel}
        selected={selected}
      />

      {/* 4 — should it be on display. Three readings it can make and one it
          cannot. */}
      <ItemDisplay display={display} />

      {/* The way into the invoices. They were a folded section under the cost
          cards; seventeen rows of a weekly-delivered item pushed everything
          above them off the panel, and the reader opening it is asking a
          different question from the one the panel answers. */}
      {detail && detail.cost_history.length > 0 && (
        <InvoicesButton detail={detail} setInvoicesOpen={setInvoicesOpen} />
      )}
    </div>
  );
};

export default ItemReport;
