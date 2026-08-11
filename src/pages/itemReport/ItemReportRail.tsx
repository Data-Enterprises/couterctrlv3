import { useMemo } from "react";
import { formatCurrency2, formatDate } from "../../utils";
import { actualPricePoints } from "../inventory/pricePoints";
import type { ActualFetchState } from "../inventory/useActualPricePoints";
import {
  buildPriceEras,
  daysSince,
  type ReportItem,
} from "./itemReportMetrics";
import type { ReceiptLine } from "./itemReportData";

/**
 * The detail beside the sheet: receipts, prices, and last year, for one row.
 *
 * Deliberately thin and deliberately dumb. The sheet already states the finding
 * and the evidence; this exists so nobody has to leave the report to check the
 * numbers behind a line before acting on it. It is a reference column, not a
 * second report — anything that needs a paragraph belongs in the evidence line
 * where it will actually be read.
 */

interface Props {
  item: ReportItem | null;
  receipts: ReceiptLine[];
  receivingComplete: boolean;
  lookbackDays: number;
  actual: ActualFetchState;
}

const Block = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="px-3 py-2.5 border-b border-gray-100">
    <div className="text-[9.5px] font-semibold uppercase tracking-wider text-content/45 mb-1.5">
      {label}
    </div>
    {children}
  </div>
);

const Line = ({
  left,
  right,
  tone = "text-content/70",
}: {
  left: string;
  right: string;
  tone?: string;
}) => (
  <div className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-50 last:border-b-0">
    <span className="text-[11px] text-content tabular-nums flex-shrink-0">
      {left}
    </span>
    <span className={`text-[11px] tabular-nums text-right ${tone}`}>
      {right}
    </span>
  </div>
);

const ItemReportRail = ({
  item,
  receipts,
  receivingComplete,
  lookbackDays,
  actual,
}: Props) => {
  const eras = useMemo(
    () => (item ? buildPriceEras(item, receipts) : []),
    [item, receipts],
  );
  const isCurrent = !!item && actual.upc === item.productCode;
  const act = useMemo(
    () => actualPricePoints(isCurrent ? actual.lines : [], item?.unitCost ?? 0),
    [isCurrent, actual.lines, item],
  );

  if (!item) {
    return (
      <div className="flex-shrink-0 shadow-lg" style={{ width: "28%" }}>
        <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
          <p className="text-[11.5px] text-content/50 text-center leading-relaxed">
            Pick a row for its receipts and prices.
          </p>
        </div>
      </div>
    );
  }

  const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "28%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-3 py-2 bg-[#1e2a4a]">
          <div className="text-[11.5px] font-semibold text-custom-white leading-tight">
            {item.description}
          </div>
          <div className="text-[10px] mt-0.5 text-custom-white truncate">
            {item.productCode}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <Block label="Received">
            {receipts.length === 0 ? (
              <div className="text-[11px] text-content/55">
                {receivingComplete
                  ? `None in ${lookbackDays} days`
                  : "Reading…"}
              </div>
            ) : (
              <>
                {receipts.slice(0, 6).map((r) => (
                  <Line
                    key={`${r.invoiceId}-${r.date}-${r.unitCost}`}
                    left={formatDate(r.date)}
                    right={`${r.units} · ${formatCurrency2(r.unitCost)}`}
                  />
                ))}
                <div
                  className={`text-[10.5px] mt-1.5 ${(lastDays ?? 0) > 21 ? "text-red-700" : "text-content/55"}`}
                >
                  Last received {lastDays} days ago
                </div>
              </>
            )}
          </Block>

          <Block label="Price points">
            {eras.length === 0 ? (
              <div className="text-[11px] text-content/55">No sales rows</div>
            ) : (
              eras
                .slice(-4)
                .reverse()
                .map((e) => (
                  <Line
                    key={`${e.start}-${e.price}`}
                    left={formatCurrency2(e.price)}
                    right={`${e.units % 1 === 0 ? e.units : e.units.toFixed(1)} u · ${e.days} d`}
                  />
                ))
            )}
            {receipts[0]?.retail > 0 && (
              <Line
                left="Intended"
                right={formatCurrency2(receipts[0].retail)}
                tone="text-content"
              />
            )}
            {item.unitCost !== null && (
              <Line left="Cost" right={formatCurrency2(item.unitCost)} />
            )}
          </Block>

          <Block label="Same week">
            <Line
              left="Last week"
              right={
                item.lw
                  ? `${Math.round(item.lw.units)} u · ${formatCurrency2(item.lw.sales)}`
                  : "no sales"
              }
            />
            <Line
              left="Last year"
              right={
                item.ly
                  ? `${Math.round(item.ly.units)} u · ${formatCurrency2(item.ly.sales)}`
                  : "no sales"
              }
            />
          </Block>

          {isCurrent && !actual.loading && (
            <Block label="Register">
              {act.exactCount + act.averagedCount === 0 ? (
                <div className="text-[11px] text-content/55">
                  No lines matched
                </div>
              ) : (
                <>
                  <Line
                    left="Transactions"
                    right={String(act.exactCount + act.averagedCount)}
                  />
                  {act.exact.slice(0, 3).map((p) => (
                    <Line
                      key={`${p.price}-${p.priceType}`}
                      left={formatCurrency2(p.price)}
                      right={`${p.trans} trans`}
                    />
                  ))}
                </>
              )}
            </Block>
          )}
          {isCurrent && actual.loading && (
            <Block label="Register">
              <div className="text-[11px] text-content/55">Reading…</div>
            </Block>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemReportRail;
