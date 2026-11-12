// Utils
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { HANDOFF_COLS, NOBODY_WHY, handoffSays } from "../utils/handoff";

// Interfaces
import type { Cause, HandoffList } from "../interfaces";

// Components
import HandoffLine from "./HandoffLine";

interface HandoffSlideProps {
  list: HandoffList;
  /** The two stores' numbers. */
  us: string;
  them: string;
  fmt: (v: number) => string;
  onShow: (cause: Cause) => void;
  onExport: () => void;
  onPickItem: (code: string) => void;
}

/** One person's list: a headline with the actions for the whole list, then
 *  every item on it, biggest first. Where a list holds more than one cause
 *  the rows name theirs; the list nobody is handed says why each is left out. */
const HandoffSlide = ({ list, us, them, fmt, onShow, onExport, onPickItem }: HandoffSlideProps) => {
  const nobody = list.owner === null;
  const several = list.desks.length > 1;
  const items = [...list.items].sort((a, b) => a.gap - b.gap);
  const signed = (v: number) => `${v < 0 ? "−" : ""}${fmt(Math.abs(v))}`;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 min-w-0">
      <div className="flex items-start gap-4">
        <p className="flex-1 text-[17px] font-semibold leading-snug text-content">
          {handoffSays(list, us, them, fmt)}
        </p>
        <span className="flex gap-1.5 flex-none">
          {!nobody && (
            <>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(list.items.map((i) => i.productCode).join(", "))
                }
                className="cc-btn-primary text-[12px]"
              >
                Copy UPCs
              </button>
              <button
                onClick={onExport}
                title="One file with every item on this list and its cause."
                className="cc-btn-outline text-[12px] text-content"
              >
                Export list
              </button>
            </>
          )}
          {!several && (
            <button
              onClick={() => onShow(list.desks[0].cause)}
              className="cc-btn-outline text-[12px] text-content"
            >
              Show in grid
            </button>
          )}
        </span>
      </div>

      {/* The grid filters one cause at a time, so a list holding several
          offers each, beside the reason it has no owner where it has none. */}
      {several && (
        <div className="flex flex-col gap-1">
          {list.desks.map((d) => (
            <div key={d.cause} className="flex items-baseline gap-2 text-[12.5px]">
              <span className="font-bold text-content whitespace-nowrap">
                {CAUSE_LABEL[d.cause]}
              </span>
              <span className="text-content/95 tabular-nums whitespace-nowrap">
                {d.items.length.toLocaleString("en-US")} items | {signed(d.dollars)}
              </span>
              {nobody && (
                <span className="text-content/95 min-w-0">{NOBODY_WHY[d.cause]?.(us, them)}</span>
              )}
              <button
                onClick={() => onShow(d.cause)}
                className="ml-auto flex-none text-[11.5px] font-semibold text-brand_navy_hover hover:underline"
              >
                Show in grid &rarr;
              </button>
            </div>
          ))}
        </div>
      )}
      {!several && nobody && (
        <p className="text-[12.5px] text-content/95">{NOBODY_WHY[list.desks[0].cause]?.(us, them)}</p>
      )}

      <div className="cc-scroll flex flex-col">
        <div
          className={`sticky top-0 z-10 bg-custom-white grid ${
            several ? HANDOFF_COLS.withCause : HANDOFF_COLS.oneCause
          } gap-3 px-1.5 pb-1.5 border-b border-brand_navy/15 cc-caps text-[10.5px] text-brand_slate`}
        >
          <span />
          <span>Item</span>
          {several && <span>Cause</span>}
          <span>UPC</span>
          <span className="text-right">Difference</span>
        </div>
        {items.map((i, ix) => (
          <HandoffLine
            key={i.productCode}
            item={i}
            n={ix + 1}
            showCause={several}
            us={us}
            them={them}
            fmt={fmt}
            onPick={onPickItem}
          />
        ))}
      </div>

      <p className="text-[12.5px] text-content/95 flex-none">
        {list.items.length.toLocaleString("en-US")} items | {signed(list.total)} | biggest
        difference first
      </p>
    </div>
  );
};

export default HandoffSlide;
