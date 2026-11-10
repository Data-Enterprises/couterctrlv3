// API
import {
  COST_HISTORY_DAYS,
  type ItemDetailResponse,
} from "../../../../../../api/topItems";

// Utils
import { dayText, moneyText } from "../utils";

// Components
import LoadingIndicator from "../../../../../../components-dev/loading/LoadingIndicator";

interface ItemBuyCostProps {
  detail: ItemDetailResponse | null;
  detailLoading: boolean;
}

/** What it costs to buy: paying now, best seen, and what waiting could save. */
const ItemBuyCost = ({ detail, detailLoading }: ItemBuyCostProps) => (
  <div
    data-help="item-buy"
    className="px-4 py-2.5 border-b border-gray-100"
  >
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-content/95">
        What it costs to buy
      </span>
      {detail?.cost_summary && (
        <span className="text-[11.5px] text-content/95">
          {detail.cost_summary.purchases} purchase
          {detail.cost_summary.purchases === 1 ? "" : "s"}{" "}
          &middot; {COST_HISTORY_DAYS} days
        </span>
      )}
    </div>

    {detailLoading && (
      <div className="relative h-20">
        <LoadingIndicator message="Loading cost history" />
      </div>
    )}

    {!detailLoading && !detail?.cost_summary && (
      <p className="text-[13px] text-content/95 leading-snug mt-1.5">
        Nothing bought in the last {COST_HISTORY_DAYS} days, so
        there is no cost history to compare against.
      </p>
    )}

    {detail?.cost_summary && (
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="rounded-md bg-bkg px-2.5 py-2">
          <div className="text-[11px] text-content/95">
            Paying now
          </div>
          <div className="text-[14.5px] font-semibold text-content tabular-nums">
            {moneyText(detail.cost_summary.paying_now)}
          </div>
        </div>
        <div className="rounded-md bg-bkg px-2.5 py-2">
          <div className="text-[11px] text-content/95 truncate">
            Best seen &middot;{" "}
            {dayText(detail.cost_summary.best_seen_on)}
          </div>
          <div className="text-[14.5px] font-semibold text-content tabular-nums">
            {moneyText(detail.cost_summary.best_seen)}
          </div>
        </div>
        {/* Amber only when waiting is worth something: a nought
            in a warning tint reads as a problem that is not
            there. */}
        <div
          className={`rounded-md px-2.5 py-2 ${
            detail.cost_summary.gap > 0.0001
              ? "bg-severity_watch_bg"
              : "bg-bkg"
          }`}
        >
          <div
            className={`text-[11px] truncate ${
              detail.cost_summary.gap > 0.0001
                ? "text-severity_watch_text"
                : "text-content/95"
            }`}
          >
            {detail.cost_summary.gap > 0.0001
              ? "Waiting could save"
              : "At the best price seen"}
          </div>
          <div
            className={`text-[14.5px] font-semibold tabular-nums ${
              detail.cost_summary.gap > 0.0001
                ? "text-severity_watch_text"
                : "text-content"
            }`}
          >
            {moneyText(detail.cost_summary.gap)}
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ItemBuyCost;
