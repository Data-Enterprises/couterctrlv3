// Hooks
import { useMemo } from "react";
import { useSelectedItem } from "./hooks";
import { useTop200Tab } from "./hooks/tab";

// API
import { TOP_ITEMS_SHOWN } from "../../../../../api/topItems";

// Utils
import {
  compareWindows,
  rankBySales,
  type TopItemCompared,
} from "./utils/topItems";

// Components
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import ItemCta from "./components/ItemCta";
import InvoicesRail from "./components/InvoicesRail";
import ItemList from "./list/ItemList";
import Top200Landing from "./landing/Top200Landing";
import ItemReport from "./item/ItemReport";

interface PopupTopItemsProps {
  storeId: number;
  /** Every store_number under this storeid. More than one means co-located
   *  stores, which this endpoint cannot tell apart. */
  locations: string[];
  /**
   * The store's own net sales for each of the three periods, whole week.
   *
   * The tiles report the top 200 as a SHARE of these rather than comparing
   * their dollars: a week up 10% lifts the top 200 with it, and a tile that
   * says +10% then reads as a change in the list when nothing about the list
   * moved.
   */
  netSales: { ty: number; lw: number | null; ly: number | null };
  /** yyyy-mm-dd. The week the popup is showing, and its two baselines; or
   *  one picked day (start === end), against the same weekday last week and
   *  last year. */
  start: string;
  end: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

/**
 * The store's biggest sellers, and one of them drilled into.
 *
 * Built on the Sub Dept Margins item view: a ranked list on the left, and on
 * the right a CTA sentence over a lead card for the ranking metric with its
 * supporting metrics beside it. Three things that view has no data for sit
 * under it — how the item rang, what it costs to buy, and the invoices.
 *
 * **Ranked by sales, not units.** `sales/topitems` orders by `qty DESC`, so
 * its two hundred are the two hundred biggest MOVERS — a $16 item selling
 * five is nowhere in that list and belongs near the top of this one. No
 * re-sort recovers a row that never came back, so the fetch asks for the
 * endpoint's ceiling and the top two hundred by sales come out of it.
 *
 * **Three windows, three calls.** The endpoint answers one week, and this
 * panel's whole language is vs LW / vs LY — every other tab on it compares.
 * So this asks for all three and joins them on product code. The alternative
 * was leaving those columns empty, which would make the tab read like a
 * different page.
 */
const PopupTopItems = ({
  storeId,
  locations,
  netSales,
  start,
  end,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: PopupTopItemsProps) => {
  const {
    oneDay,
    periodLabel,
    fold,
    haveRows,
    folded,
    invoicesOpen,
    setInvoicesOpen,
    topItems,
    topItemsLW,
    topItemsLY,
    topItemsLoading,
    detail,
  } = useTop200Tab({
    storeId,
    locations,
    netSales,
    start,
    end,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
  });

  const ranked: TopItemCompared[] = useMemo(() => {
    if (!haveRows) return [];
    const top = rankBySales(topItems, TOP_ITEMS_SHOWN);
    return compareWindows(top, topItemsLW, topItemsLY);
  }, [topItems, haveRows, topItemsLW, topItemsLY]);

  const { selected, insight } = useSelectedItem(ranked);

  if (topItemsLoading && !haveRows) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Loading top items" />
      </div>
    );
  }

  if (haveRows && ranked.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No items sold in this store that week
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/*
        Co-located stores share one storeid, and `sales/topitems` reads by
        storeid alone — there is no store_number on the request, so this tab
        answers for every location under that id at once. The totals above it
        are one location, and the two figures contradict each other on screen.
        Said outright until the endpoint can take a store number: the fix is
        not available here, because the top 200 was ranked across both
        locations before it arrived, and filtering the rows afterwards would
        leave an arbitrary subset rather than this store's own top 200.
      */}
      {locations.length > 1 && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-severity_watch_bg text-severity_watch_text text-[11.5px] leading-snug border-b border-severity_watch_text/25">
          <span className="font-semibold">
            Both locations: {locations.join(" and ")}.
          </span>{" "}
          They share one store id and this tab reads by store id, so it cannot
          be narrowed to one of them — the figures above the tabs are this
          location alone.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* The ranked list */}
        <ItemList ranked={ranked} />

        {/* The selected item */}
        <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          {!selected || !insight ? (
            /* Nothing picked: where the week's money came from, by department.
             Rolled up from the rows already on screen, so it costs no call
             and cannot disagree with the list beside it. */
            <Top200Landing
              ranked={ranked}
              netSales={netSales}
              oneDay={oneDay}
              start={start}
              end={end}
              lwStart={lwStart}
              lwEnd={lwEnd}
              lyStart={lyStart}
              lyEnd={lyEnd}
            />
          ) : (
            <>
              {/* The Sub dept tab's strip, to the letter: icon, name, the
                word for what it is, a chevron, and the sentence as an overlay
                rather than inline — so opening it cannot push the cards
                below out from under the reader's cursor. */}
              <ItemCta
                insight={insight}
                selected={selected}
                folded={folded}
                fold={fold}
              />

              <ItemReport
                ranked={ranked}
                periodLabel={periodLabel}
                setInvoicesOpen={setInvoicesOpen}
              />
            </>
          )}

          {/* The invoices, over the panel rather than inside it.
              Mounted whether or not it is open, so it slides instead of
              appearing -- and inert while closed, so tabbing cannot land in
              a panel nobody can see. */}
          <InvoicesRail
            invoicesOpen={invoicesOpen}
            setInvoicesOpen={setInvoicesOpen}
            selected={selected}
            detail={detail}
          />
        </div>
      </div>
    </div>
  );
};

export default PopupTopItems;
