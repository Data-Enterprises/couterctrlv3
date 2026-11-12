// Utils
import { formatCurrency2 } from "../../../../../utils";
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { OWNER_LABEL, type Desk } from "../utils/investigationSteps";

// Interfaces
import type { Cause } from "../interfaces";

interface ActPanelProps {
  desks: Desk[];
  cash: (v: number) => string;
  onShow: (c: Cause) => void;
  onExport: (d: Desk) => void;
  onPickItem: (code: string) => void;
}

/* ------------------------------------------------------------------ */
/* Step 5 · who fixes it                                               */
/* ------------------------------------------------------------------ */

/** The investigation's "who fixes it" tab: a card per desk with the items it owns and an export,
 *  plus a line for each cause nobody can act on, each with a "Show in grid" button. */
const ActPanel = ({ desks, cash, onShow, onExport, onPickItem }: ActPanelProps) => {
  const owned = desks.filter((d) => d.actionable);
  const quiet = desks.filter((d) => !d.actionable);

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
      <div className="max-w-[1100px] flex flex-col gap-4">
        {/* Above the cards, not under them. These are the piles nobody is
            being handed, and a reader who has already read four lists has
            stopped looking for a fifth thing — which is how a shortfall
            goes quiet. */}
        {quiet.map((d) => (
          <div
            key={d.cause}
            className="flex items-center gap-3 flex-wrap rounded-lg bg-bkg shadow-card-sm px-4 py-2.5"
          >
            <span className="text-[12px] font-bold uppercase tracking-wide text-content/95 flex-shrink-0">
              {CAUSE_LABEL[d.cause]}
            </span>
            <span className="text-[14px] font-bold tabular-nums text-delta_negative_text flex-shrink-0">
              {"−"}
              {cash(Math.abs(d.dollars))}
            </span>
            <span className="text-[13px] leading-snug text-content/95 min-w-0">
              {d.says} Nothing here names anything to act on, so it goes on no
              list.
            </span>
            <button
              onClick={() => onShow(d.cause)}
              className="ml-auto flex-shrink-0 px-3 py-1.5 rounded-md bg-custom-white shadow-card-sm text-[12px] font-bold text-content hover:bg-brand_navy/5 transition-colors"
            >
              Show in grid &rarr;
            </button>
          </div>
        ))}

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
        >
          {owned.map((d) => (
            <div
              key={d.cause}
              className="flex flex-col gap-2.5 rounded-lg bg-bkg shadow-card-sm p-4"
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-content/95">
                {CAUSE_LABEL[d.cause]} ·{" "}
                <span className="text-delta_negative_text">
                  {cash(Math.abs(d.dollars))}
                </span>
              </span>
              <span className="text-[15px] font-bold text-content">
                {"→"} {OWNER_LABEL[d.owner as "buyer" | "receiving" | "price"]}
              </span>
              <p className="text-[13px] leading-relaxed text-content/95">
                {d.says}
              </p>

              <ul className="flex flex-col gap-1">
                {d.items.slice(0, 4).map((i) => (
                  <li key={i.productCode} className="flex items-baseline gap-2">
                    <button
                      onClick={() => onPickItem(i.productCode)}
                      className="min-w-0 truncate text-left text-[12px] font-mono text-brand_navy_hover hover:underline"
                    >
                      {i.description}
                    </button>
                    <span className="ml-auto text-[12px] tabular-nums text-delta_negative_text whitespace-nowrap">
                      {"−"}
                      {formatCurrency2(Math.abs(i.gap))}
                    </span>
                  </li>
                ))}
                {d.items.length > 4 && (
                  <li className="text-[12px] text-content/95">
                    + {(d.items.length - 4).toLocaleString("en-US")} more
                  </li>
                )}
              </ul>

              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      d.items.map((i) => i.productCode).join(", "),
                    )
                  }
                  className="px-3 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors"
                >
                  Copy UPCs
                </button>
                <button
                  onClick={() => onExport(d)}
                  className="px-3 py-1.5 rounded-md bg-custom-white text-[12px] font-bold text-content hover:bg-brand_navy/5 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => onShow(d.cause)}
                  className="px-3 py-1.5 rounded-md bg-custom-white text-[12px] font-bold text-content hover:bg-brand_navy/5 transition-colors"
                >
                  Show in grid
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActPanel;
