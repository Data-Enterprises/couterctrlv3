// Hooks
import { useEffect, useRef } from "react";

// Utils
import { usDate } from "../utils";

// Interfaces
import type { InvestigationTarget } from "../../../../../features/dev/devSalesLedgerSlice";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import PageInfoButton from "../../../../../components-dev/PageInfoButton";
import Waves from "./Waves";

interface InvestigationHeaderProps {
  target: InvestigationTarget;
  twStart: string;
  twEnd: string;
  salesIn: boolean;
  allIn: boolean;
  /** Nothing left by the filters, so nothing to export. */
  empty: boolean;
  onBack: () => void;
  onExport: () => void;
}

/** The navy bar: the way out, the two stores, and the export. */
const InvestigationHeader = ({
  target,
  twStart,
  twEnd,
  salesIn,
  allIn,
  empty,
  onBack,
  onExport,
}: InvestigationHeaderProps) => {
  /* The way out takes the focus on arrival: it is where a reader who came
     in by keyboard expects to be, and it is the one control on the page
     that is in the same place on every tab. */
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex-shrink-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 bg-brand_navy animate-nb-drop motion-reduce:animate-none">
      {/* Where you came from: the way out, the department, and the week
          it is read over. */}
      <span className="flex items-center gap-2.5 min-w-0 justify-self-start">
        <button
          ref={backRef}
          onClick={onBack}
          title="Back to the comparison"
          className="flex-shrink-0 text-custom-white text-[12.5px] font-semibold hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-white/70"
        >
          ‹ Back
        </button>
        <span className="flex-shrink-0 text-[12.5px] text-custom-white/95">
          |
        </span>
        <span className="text-[12.5px] cc-navy-title truncate">
          {target.subDeptName}
        </span>
        <span
          data-help="supply-window"
          className="hidden lg:inline flex-shrink-0 text-[12.5px] font-semibold text-custom-white/95 whitespace-nowrap tabular-nums"
        >
          {usDate(twStart)} &ndash; {usDate(twEnd)}
        </span>
      </span>

      {/* What you are reading. The only part that differs between two open
          investigations, so it takes the middle -- and the only part in
          bold, where the rest of the bar is semibold. */}
      <span className="flex items-center gap-2 min-w-0 justify-self-center text-[13px]">
        <span className="w-2.5 h-2.5 rounded-full bg-store_open flex-shrink-0" />
        <span className="font-bold text-custom-white truncate">
          {target.storeName}
        </span>
        <span className="flex-shrink-0 font-semibold text-custom-white/95">
          vs
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-store_compare flex-shrink-0" />
        <span className="font-bold text-custom-white truncate">
          {target.compareStoreName}
        </span>
      </span>

      <span className="flex items-center gap-3 justify-self-end">
        {/* Only while something is still coming. Three lit lamps said
            nothing, forever, in the busiest strip on the page. */}
        {!allIn && <Waves sales={salesIn} all={allIn} />}
        <button
          data-help="export"
          onClick={onExport}
          disabled={empty}
          title={
            empty
              ? "Nothing to export yet"
              : "Every filtered row, as a CSV"
          }
          aria-label="Export CSV"
          className="flex-shrink-0 text-custom-white hover:text-custom-white/80 disabled:opacity-40 disabled:hover:text-custom-white transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-white/70"
        >
          <ArrowDownTrayIcon className="w-[18px] h-[18px]" />
        </button>
        <PageInfoButton
          page="sales-investigate"
          variant="navy"
          title="How this report works"
        />
      </span>
    </div>
  );
};

export default InvestigationHeader;
