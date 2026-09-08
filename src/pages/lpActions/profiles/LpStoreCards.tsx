import { formatCurrency2, formatDateSimple } from "../../../utils";
import {
  REASON_LABEL,
  reasonOf,
  type FlagReason,
  type StoreCall2,
} from "./call2Model";

/**
 * The store's general overview, entirely from call 2.
 *
 * Four sections for the four things call 1 cannot answer: how far out the
 * people here are, what the peer line they are measured against actually is,
 * when the store's flagged weeks fell, and whether this is one bad week or
 * somebody coming back. Nothing here restates the baseline — the ledger on the
 * left is already saying that, and one figure printed in two shapes is two
 * figures that eventually disagree.
 *
 * Sections divided by the app's hairline rather than four bordered cards.
 * Every other Performance panel sections inside one surface — a card inside a
 * card inside a panel is three borders deep before any content, and it is what
 * made this read as a different product.
 *
 * Every section is honest about the same limit: call 2 was asked for the
 * flagged cashiers only, so an empty one means nobody here cleared the
 * threshold. It says so in words rather than drawing a zero, because a drawn
 * zero reads as "nothing happened".
 */
interface Props {
  data: StoreCall2;
  /** Everyone who rang this at the store, from call 1 — the denominator call 2
   *  cannot supply, because it was never sent the clean ones. */
  people: number;
  windowWeeks: number;
}

const HEAD =
  "text-[11.5px] font-semibold uppercase tracking-wide text-content/80";

const Section = ({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) => (
  <div className="px-4 py-3 border-b border-[#1e2a4a]/15 last:border-b-0 min-w-0">
    <div className="flex items-baseline gap-2 mb-2">
      <span className={`${HEAD} min-w-0 flex-1 truncate`}>{title}</span>
      {aside && (
        <span className="flex-shrink-0 text-[12px] text-content/85 tabular-nums">
          {aside}
        </span>
      )}
    </div>
    {children}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="m-0 text-[12px] text-content/85 leading-relaxed">{text}</p>
);

const REASON_ORDER: FlagReason[] = ["persistent", "multiType", "oneWeek"];

const REASON_TONE: Record<FlagReason, string> = {
  persistent: "bg-red-500",
  multiType: "bg-amber-400",
  oneWeek: "bg-gray-300",
};

const LpStoreCards = ({ data, people, windowWeeks }: Props) => {
  const { flagged, peer, weeks, reasons } = data;
  const peerWeekly = peer?.weekly.avg_line_count ?? 0;
  const topIndex = Math.max(1, ...flagged.map((c) => c.index ?? 0));
  const peakWeek = Math.max(1, ...weeks.map((w) => w.lines));

  return (
    <div className="grid grid-cols-2 divide-x divide-[#1e2a4a]/15">
      {/* ── who is out, and by how far ─────────────────────────────────── */}
      <Section title="Who is out" aside={`${flagged.length} of ${people}`}>
        {flagged.length === 0 ? (
          <Empty text="Nobody here ran far enough above the peer average to be graded." />
        ) : (
          <div className="flex flex-col gap-2">
            {flagged.slice(0, 5).map((c) => (
              <div key={c.cashierNumber} className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-content">
                    {c.cashierName}
                  </span>
                  <span className="flex-shrink-0 text-[12px] font-bold px-1.5 py-0.5 rounded bg-severity_critical_bg text-severity_critical_text tabular-nums">
                    {c.index === null ? "—" : `${c.index.toFixed(1)}×`}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 flex-1 rounded bg-gray-200 overflow-hidden">
                    <span
                      className="block h-full rounded bg-red-500"
                      style={{
                        width: `${Math.max(3, ((c.index ?? 0) / topIndex) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="flex-shrink-0 text-[12px] text-content/85 tabular-nums">
                    {c.lines} · {formatCurrency2(c.sales)}
                  </span>
                </div>
              </div>
            ))}
            {flagged.length > 5 && (
              <p className="m-0 text-[12px] text-content/85">
                {flagged.length - 5} more on the roster
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ── the line they are measured against ─────────────────────────── */}
      <Section
        title="Against peers"
        aside={peer ? `${peer.peer_count} in the group` : undefined}
      >
        {!peer ? (
          <Empty text="No peer baseline came back for this exception." />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-bold text-content tabular-nums">
                {peerWeekly.toFixed(1)}
              </span>
              <span className="text-[12px] text-content/85">
                lines per cashier, per week
              </span>
            </div>
            <p className="mt-1.5 mb-0 text-[12px] leading-relaxed text-content/85">
              Averaged over{" "}
              <span className="font-semibold text-content tabular-nums">
                {peer.weekly.peer_count}
              </span>{" "}
              cashier-weeks across every store that rang it — the clean ones
              included, so the line is the whole population and not the
              outliers.
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                  Receipts
                </div>
                <div className="text-[13px] font-bold text-content tabular-nums">
                  {peer.weekly.avg_transaction_count.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                  Value
                </div>
                <div className="text-[13px] font-bold text-content tabular-nums">
                  {formatCurrency2(peer.weekly.avg_total_sales)}
                </div>
              </div>
            </div>
            {!peer.gradeable.line_count && (
              <p className="mt-2 mb-0 text-[12px] text-severity_watch_text">
                Lines could not be graded for this exception — the peer average
                is zero, so an index would divide by nothing.
              </p>
            )}
          </>
        )}
      </Section>

      {/* ── which of the weeks went wrong ──────────────────────────────── */}
      <Section
        title="Flagged weeks"
        aside={`${weeks.length} of ${windowWeeks}`}
      >
        {weeks.length === 0 ? (
          <Empty text="No single week here was flagged on its own." />
        ) : (
          <div className="flex flex-col gap-2">
            {weeks.map((w) => (
              <div key={w.start} className="flex items-center gap-2.5">
                <span className="w-[52px] flex-shrink-0 text-[12px] text-content/85 tabular-nums">
                  {formatDateSimple(w.start)}
                </span>
                <span className="h-4 flex-1 rounded bg-gray-200 overflow-hidden">
                  <span
                    className="block h-full rounded bg-red-500"
                    style={{
                      width: `${Math.max(4, (w.lines / peakWeek) * 100)}%`,
                    }}
                  />
                </span>
                <span className="w-[34px] flex-shrink-0 text-right text-[13px] font-semibold text-content tabular-nums">
                  {w.lines}
                </span>
                <span className="w-[64px] flex-shrink-0 text-right text-[12px] text-content/85 tabular-nums">
                  {w.cashiers} {w.cashiers === 1 ? "cashier" : "cashiers"}
                </span>
              </div>
            ))}
            <p className="m-0 text-[12px] text-content/85">
              Only weeks graded above the peer line are drawn. A quiet week is
              absent, not zero.
            </p>
          </div>
        )}
      </Section>

      {/* ── one bad week, or somebody coming back ──────────────────────── */}
      <Section
        title="Why they flagged"
        aside={
          data.maxWeeksFlagged > 0
            ? `worst ${data.maxWeeksFlagged} wk`
            : undefined
        }
      >
        {flagged.length === 0 ? (
          <Empty text="Nothing to characterise — nobody here was graded." />
        ) : (
          <div className="flex flex-col gap-2">
            {REASON_ORDER.map((r) => (
              <div key={r} className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${REASON_TONE[r]}`}
                />
                <span className="min-w-0 flex-1 text-[13px] text-content">
                  {REASON_LABEL[r]}
                </span>
                <span className="flex-shrink-0 text-[13px] font-semibold text-content tabular-nums">
                  {reasons[r]}
                </span>
              </div>
            ))}
            <p className="m-0 pt-2 border-t border-[#1e2a4a]/15 text-[12px] text-content/85">
              {flagged
                .filter((c) => reasonOf(c) !== "oneWeek")
                .slice(0, 3)
                .map((c) => c.cashierName)
                .join(", ") ||
                "Every one of them is a single flagged week so far."}
              {reasons.persistent + reasons.multiType > 0
                ? " — worth opening before the others."
                : ""}
            </p>
          </div>
        )}
      </Section>
    </div>
  );
};

export default LpStoreCards;
