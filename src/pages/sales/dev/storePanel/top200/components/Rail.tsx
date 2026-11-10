// Hooks
import { useState } from "react";

// Utils
import { CTA_SEVERITY_CLASSES, severityDotClass } from "../../../../../../utils/severity";
import { avgPrice } from "../utils/topItems";
import {
  amountTextOf,
  metricSigned,
  type ComparedTopItem,
  type CompareMetric,
} from "../utils/topItemsCompare";
import { money, pct, priceLines, pts, signedMoney, toneOf } from "../utils";

// Interfaces
import {
  type ItemDetailResponse,
  type TopItemPricePoint,
} from "../../../../../../api/topItems";

// Components
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import PriceRow from "./PriceRow";

/** The Top 200 comparison's side rail for the picked item: a severity-tinted strip that opens to the item's
 *  figure and whether the other store carries it, over a price-by-price grid of what each store rang. */
const Rail = ({
  row,
  metric,
  openStoreName,
  compareStoreName,
  minePoints,
  theirsPoints,
  absent,
  absentLoading,
}: {
  row: ComparedTopItem | null;
  metric: CompareMetric;
  openStoreName: string;
  compareStoreName: string;
  minePoints: TopItemPricePoint[];
  theirsPoints: TopItemPricePoint[];
  absent: ItemDetailResponse | null;
  absentLoading: boolean;
}) => {
  /** The strip opens closed, like every other one. */
  const [open, setOpen] = useState(false);

  if (!row) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center px-4">
        <p className="text-[13px] text-content text-center">
          Pick an item to compare it.
        </p>
      </div>
    );
  }

  const lines = priceLines(row.code, minePoints, theirsPoints);
  // The same tone the row wears, so the rail and the list never disagree
  // about which way this item goes.
  const sev = toneOf(metricSigned(row, metric));
  const cta = CTA_SEVERITY_CLASSES[sev];
  const Mark_ = sev === "critical" ? ExclamationCircleIcon : CheckCircleIcon;

  const figure = (label: string, a: string, b: string, bold = false) => (
    <>
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={`text-right tabular-nums ${bold ? "font-bold" : ""}`}>
        {a}
      </span>
      <span className={`text-right tabular-nums ${bold ? "font-bold" : ""}`}>
        {b}
      </span>
    </>
  );
  const missingName =
    row.only === "mine" ? compareStoreName : openStoreName;
  const sold = absent?.stores?.[0] ?? null;


  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/*
        Tinted by this item's own grade, the way the panel's own title bar is
        tinted by the store's. Not a CtaStrip: a strip's job is to hold detail
        BEHIND a chevron, and nothing here should be behind one -- the claim
        under it is the most important sentence on the screen. So it takes the
        severity dress without the folding.
      */}
      {/*
        The same strip the department comparison opens with: the name, and the
        finding folded behind it. Over the panel rather than above it, so
        opening and closing never moves the blocks underneath — the reader
        keeps their place in the thing the strip describes.
      */}
      <div className={`relative flex-shrink-0 border-b ${cta.border}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left transition-colors ${cta.bg} ${cta.hoverBg}`}
        >
          <Mark_ className={`w-4 h-4 flex-shrink-0 ${cta.text}`} />
          <span
            className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${cta.text}`}
          >
            {row.description}
          </span>
          {open ? (
            <ChevronUpIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          ) : (
            <ChevronDownIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          )}
        </button>

        {open && (
          <div
            className={`absolute top-full left-0 right-0 z-20 px-3.5 py-2.5 border-b shadow-lg ${cta.bg} ${cta.border}`}
          >
            {/* The points live here, not on the strip: the row the reader
                just clicked already carries the same figure, and twice on one
                screen is once too many. */}
            <p className={`text-[12.5px] leading-snug ${cta.text}`}>
              <span className="font-bold tabular-nums">
                {row.only !== null ? "≥ " : ""}
                {metric === "sales"
                  ? signedMoney(metricSigned(row, metric))
                  : `${pts(metricSigned(row, metric))} pts`}
              </span>
              {" · "}
              <span className="tabular-nums">{row.code}</span>
              {" · "}
              {row.dept}
              {row.only === null && " · carried by both"}
            </p>

            {row.only !== null && (
              <p className={`text-[12.5px] leading-snug mt-1.5 ${cta.text}`}>
                Not in <b>{missingName}&rsquo;s top 200</b>
                {absentLoading && " — asking…"}
                {!absentLoading && sold && (
                  <>
                    {" "}
                    — and they sold <b>{money(sold.total_sales)}</b> of it this
                    week.
                  </>
                )}
                {!absentLoading && absent && !sold && (
                  <> — and they sold <b>none of it this week</b>.</>
                )}
                {" "}
                A sales answer, not a shelf one: a slow mover can be stocked and
                ring nothing in a week.
              </p>
            )}

            {row.unitsDisagree && (
              <p className={`text-[12.5px] leading-snug mt-1.5 ${cta.text}`}>
                <b>These stores ring this code differently</b> — one on the
                scale, one as a pack. The amounts are not comparable; sales
                and share still are.
              </p>
            )}
          </div>
        )}
      </div>

      <div
        data-help="top200-compare-rail"
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3.5 py-3 flex flex-col gap-6"
      >
        {/* "Comparison" sits ON the header row with the two store names
            rather than above it, and each name carries its bar swatch so the
            rail and the list agree about which store is which. The columns
            are 132px: at 96 a store name clipped to "002 - IGA IRV…". */}
        <div>
          <div className="grid grid-cols-[1fr_128px_128px] gap-x-5 gap-y-1.5 text-[13.5px] text-content items-baseline">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Comparison
            </span>
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full flex-none ${severityDotClass[sev]}`} />
              <span className="truncate">{openStoreName}</span>
            </span>
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full flex-none bg-brand_navy/15 border border-brand_navy/25" />
              <span className="truncate">{compareStoreName}</span>
            </span>

            <span className="col-span-3 h-px bg-brand_line my-0.5" />

            {figure(
              "Sales",
              row.mine ? money(row.mineSales) : "—",
              row.theirs ? money(row.theirsSales) : "—",
              true,
            )}
            {figure(
              "Amount",
              amountTextOf(row.mine) ?? "—",
              amountTextOf(row.theirs) ?? "—",
            )}
            {figure(
              "Avg price",
              row.mine ? (avgPrice(row.mine)?.toFixed(2) ?? "—") : "—",
              row.theirs ? (avgPrice(row.theirs)?.toFixed(2) ?? "—") : "—",
            )}
            {figure(
              "Margin",
              row.mine?.margin !== null && row.mine !== null
                ? `${row.mine.margin.toFixed(1)}%`
                : "—",
              row.theirs?.margin !== null && row.theirs !== null
                ? `${row.theirs.margin.toFixed(1)}%`
                : "—",
            )}
            {figure(
              "Share of top 200",
              pct(row.mineShare),
              pct(row.theirsShare),
              true,
            )}
          </div>
        </div>

        {lines.length > 0 && (
          <div>
            {/* No heading: "Price" over the first column with a store over
                each of the others already says what this is. */}
            <div className="grid grid-cols-[76px_1fr_1fr] gap-x-5 gap-y-1.5 text-[13px] text-content items-baseline">
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Price
              </span>
              <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full flex-none ${severityDotClass[sev]}`} />
                <span className="truncate">{openStoreName}</span>
              </span>
              <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full flex-none bg-brand_navy/15 border border-brand_navy/25" />
                <span className="truncate">{compareStoreName}</span>
              </span>

              <span className="col-span-3 h-px bg-brand_line my-0.5" />

              {lines.map((l) => (
                <PriceRow key={l.price} line={l} />
              ))}
            </div>
            <p className="text-[12.5px] text-content leading-snug mt-2.5">
              Keyed on the price, so the rows line up and a blank cell is the
              finding: the other store never rang it at that.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rail;
