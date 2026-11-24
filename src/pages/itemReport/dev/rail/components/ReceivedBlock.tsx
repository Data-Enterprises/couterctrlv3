// Hooks
import { useMemo } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useItemReportCtx } from "../../hooks";

// Redux
import { setItemReportExpandedReceipt } from "../../../../../features/dev/devItemReportSlice";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../../utils";
import { deliveryGap } from "../../utils/verdict";
import { daysSince } from "../../utils/metrics";

// Interfaces
import type { ReceiptLine } from "../../interfaces";
import type { Fold } from "../interfaces";

// Components
import Block from "./Block";
import Head from "./Head";
import Line from "./Line";
import ShowAll from "./ShowAll";
import ReceiptDetail from "./ReceiptDetail";

interface ReceivedBlockProps {
  fold: Fold;
  receipts: ReceiptLine[];
  receivingComplete: boolean;
  lookbackDays: number;
  /** Every delivery shown, not just the latest six. */
  expanded: boolean;
  onToggleAll: () => void;
}

/** The deliveries in the lookback: date, quantity, cost, retail and the margin
 *  the invoice implied, each opening to its free goods and returns. */
const ReceivedBlock = ({
  fold,
  receipts,
  receivingComplete,
  lookbackDays,
  expanded,
  onToggleAll,
}: ReceivedBlockProps) => {
  const dispatch = useAppDispatch();
  const { expandedReceipt } = useItemReportCtx();
  /**
   * How often this item normally arrives, across every delivery in the
   * lookback — not just the handful on screen. Paired with "last received 24
   * days ago" it becomes a decision. From the metrics, so the verdict and this
   * line share one copy of the arithmetic.
   */
  const avgGap = useMemo(() => deliveryGap(receipts), [receipts]);
  const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;

  return (
    <Block
      {...fold}
      label={`Received (${lookbackDays} days)`}
      note={
        lastDays === null
          ? undefined
          : // Reads as a sentence rather than two abbreviations: "every
            // 8" had no unit at all, and "16d ago" never said ago from
            // what. The second figure inherits "days" from the first.
            `Last received ${lastDays === 0 ? "today" : `${lastDays} day${lastDays === 1 ? "" : "s"} ago`}${
              avgGap === null ? "" : ` · usually every ${avgGap}`
            }`
      }
      noteTone={
        (lastDays ?? 0) > 21 ? "text-severity_critical_text" : "text-content"
      }
    >
      {receipts.length === 0 ? (
        <div className="text-[12px] text-content">
          {receivingComplete ? `None in ${lookbackDays} days` : "Reading…"}
        </div>
      ) : (
        <>
          {/* Cost and retail side by side, with the margin the invoice
              implied. Three of the four Reprice triggers compare against
              one of these, so the sentence in the sheet is checkable
              against the deliveries that produced it. */}
          <Head cols={["Date", "Qty", "Cost", "Retail", "GM%"]} />
          {(expanded ? receipts : receipts.slice(0, 6)).map((r, i) => {
            const key = `${r.invoiceId}-${r.date}-${r.unitCost}`;
            const open = expandedReceipt === key;
            const adjusted = r.free > 0 || r.returned > 0;
            const gm =
              r.retail > 0 ? ((r.retail - r.unitCost) / r.retail) * 100 : null;
            return (
              <div key={key}>
                <Line
                  zebra={i % 2 === 1}
                  onClick={() => dispatch(setItemReportExpandedReceipt(key))}
                  cells={[
                    {
                      // The marker is really the feature. Without
                      // something on the collapsed row saying a delivery
                      // carried free goods or a return, nobody opens
                      // anything and the strip below may as well not
                      // exist.
                      text: `${open ? "▾" : adjusted ? "•" : "›"} ${formatDateSimple(r.date)}`,
                    },
                    // Cases beside units: Receivers shows the
                    // invoice in cases (56), this showed units (224),
                    // and nothing joined the two (finding R).
                    {
                      text:
                        r.cases > 0
                          ? `${r.sellingUnits} · ${r.cases}cs`
                          : String(r.sellingUnits),
                    },
                    { text: formatCurrency2(r.unitCost) },
                    {
                      text: r.retail > 0 ? formatCurrency2(r.retail) : "—",
                    },
                    { text: gm === null ? "—" : `${gm.toFixed(1)}%` },
                  ]}
                />
                {open && <ReceiptDetail line={r} />}
              </div>
            );
          })}
          {receipts.length > 6 && (
            <ShowAll
              total={receipts.length}
              expanded={expanded}
              onToggle={onToggleAll}
            />
          )}
        </>
      )}
    </Block>
  );
};

export default ReceivedBlock;
