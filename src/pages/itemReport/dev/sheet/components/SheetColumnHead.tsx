// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useItemReportCtx } from "../../hooks";

// Redux
import {
  setItemReportUpcFilter,
  setItemReportDescFilter,
} from "../../../../../features/dev/devItemReportSlice";

// Utils
import { COLS } from "../../utils";

// Components
import ColFilter from "../../../../../components-dev/filters/ColFilter";
import { colInputStyle } from "../../../../../components-dev/filters/colFilterStyles";

/** The sheet's column headings, with the UPC and Desc filters on Item. */
const SheetColumnHead = () => {
  const dispatch = useAppDispatch();
  const { upcFilter: upcTerm, descFilter: descTerm } = useItemReportCtx();
  // Draft stays local — a half-typed UPC is not page state, and only the value
  // behind Apply changes what the list shows.
  const [draftUpc, setDraftUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  return (
    <div
      className="flex-shrink-0 grid gap-3 px-3 py-1.5 border-b border-line_hair bg-fill_soft text-[11.5px] cc-caps"
      style={{ gridTemplateColumns: COLS }}
    >
      <span>Action</span>
      <span className="flex items-center gap-2 min-w-0">
        Item
        <ColFilter
          label="UPC"
          active={!!upcTerm}
          onApply={() => dispatch(setItemReportUpcFilter(draftUpc))}
          onClear={() => {
            dispatch(setItemReportUpcFilter(""));
            setDraftUpc("");
          }}
        >
          <input
            autoFocus
            style={colInputStyle}
            placeholder="Search UPC…"
            value={draftUpc}
            onChange={(e) => setDraftUpc(e.target.value)}
          />
        </ColFilter>
        <ColFilter
          label="Desc"
          active={!!descTerm}
          onApply={() => dispatch(setItemReportDescFilter(draftDesc))}
          onClear={() => {
            dispatch(setItemReportDescFilter(""));
            setDraftDesc("");
          }}
        >
          <input
            autoFocus
            style={colInputStyle}
            placeholder="Search description…"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
          />
        </ColFilter>
      </span>
      <span className="text-right">Units</span>
      {/* Units, not dollars: Top 200's "vs LW" is sales, and the same
          label meaning two things read as two answers for one item
          (finding Q). */}
      <span
        className="text-right"
        title="Change in units sold against last week"
      >
        Units vs LW
      </span>
      <span
        className="text-right"
        title="Change in units sold against the same week last year"
      >
        Units vs LY
      </span>
      <span className="text-right" title="Selling units received, last 14 days">
        Recv
      </span>
      {/* Received less sold over the days both are known for. A change, not
          a level — there is no opening balance anywhere in the data. */}
      <span className="text-right" title="Received less sold, last 14 days">
        Net
      </span>
      <span className="text-right">Last</span>
      {/* Trailing and uncoloured on purpose. Money decides which of forty
          reorders gets done first, but it isn't what the row is about. */}
      <span className="text-right">Sales</span>
    </div>
  );
};

export default SheetColumnHead;
