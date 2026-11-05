// Hooks
import { Fragment } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useItemPerfCtx } from "../hooks";

// Redux
import { clearPerfItem } from "../../../../../features/dev/devItemPerfSlice";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { cmpShort, pct } from "../utils";

// Components
import MobilePerfDetail from "../../../../../components-dev/mobile/MobilePerfDetail";
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import MarginSummary from "./MarginSummary";
import ItemPerfInfoSheet from "./ItemPerfInfoSheet";

/** One item's week: its margin card and a table of its days. */
const ItemWeekScreen = () => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const {
    selectedItem,
    itemCode,
    windowLabel,
    dailyRows,
    dayPairs,
    dayMax,
    basis,
    cardNoLy,
  } = useItemPerfCtx();
  return (
    <>
      <MobilePerfDetail
        tabs={[{ key: "week", label: "Week" }]}
        active="week"
        onTab={() => {}}
        scopeName={selectedItem?.product_description ?? "Item"}
        when={`${itemCode ?? ""} · ${windowLabel}`}
        // Back names where it goes, because this screen is reached two ways.
        backLabel={perf.searchOpen ? "Search" : (perf.openGroup?.label ?? "Items")}
        onBack={() => dispatch(clearPerfItem())}
        levelKey={`item|${itemCode ?? ""}`}
      >
        <MarginSummary />
        {/* brand_line, not gray-100, for every rule in this table. The card
            is custom-white (#f4f7f8) and gray-100 is #f3f4f6 — one step
            apart, so the dividers were being drawn, just not in a colour
            anyone could see. brand_line is the theme's hairline token and
            is subtle without being invisible. */}
        <table className="w-full border-collapse border-t border-brand_line text-[12.5px]">
          <thead>
            <tr>
              {["Day", "Sales", "Qty", "GPM"].map((h, i) => (
                <th
                  key={h}
                  className={`border-b border-brand_line px-2 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-content/95 ${
                    i === 0 ? "pl-3.5 text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailyRows.map((d) => {
              // `days` is the same week already scoped to this item for the
              // card above, so the day's last year is in hand — no second
              // pass over the rows to put a comparison under each day.
              const pair = dayPairs.get(d.iso);
              return (
                <Fragment key={d.iso}>
                  {/* The figures keep their own row so the four columns stay
                      in line with the header; the bars take a borderless row
                      under them and carry the divider for the pair. A single
                      row cannot do both — a bar spanning four columns and
                      figures sitting in them are different geometries. */}
                  <tr>
                    <td className="pb-1 pt-2.5 pl-3.5 font-display text-[13px] font-semibold text-content">
                      {d.label}
                    </td>
                    {/* A dash, not a zero: the item did not sell that day,
                        which is not the same as selling nothing. */}
                    <td className="px-2 pb-1 pt-2.5 text-right text-content/95">
                      {d.absent ? "—" : formatCurrency2(d.sales)}
                    </td>
                    <td className="px-2 pb-1 pt-2.5 text-right text-content/95">
                      {d.absent ? "—" : d.units.toLocaleString("en-US")}
                    </td>
                    <td className="px-2 pb-1 pt-2.5 pr-3.5 text-right font-bold text-content">
                      {d.absent ? "—" : pct(d.gpm)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      className="border-b border-brand_line px-3.5 pb-2.5"
                    >
                      <PairedBars
                        ty={pair?.ty ?? d.sales}
                        ly={pair?.ly ?? 0}
                        max={dayMax}
                        labels={["TY", cmpShort(basis)]}
                        lyUnavailable={cardNoLy}
                        compact
                      />
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </MobilePerfDetail>
      <ItemPerfInfoSheet />
    </>
  );
};

export default ItemWeekScreen;
