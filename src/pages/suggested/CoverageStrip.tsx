import type { SuggestedCoverage } from "../../interfaces";

/**
 * What the waste figure on this sheet is actually built from.
 *
 * Replaces the old "Shrink applied" tile, which counted how many items got an
 * uplift. A count cannot say whether the sheet is measured or guessed, and that
 * is the question — half the items here carry a real markdown rate and half
 * carry nothing at all, and the order treats both the same way.
 *
 * The counts are over the WHOLE result set rather than the visible page, which
 * is why they can read higher than the department on screen. That is the
 * endpoint's own framing: `data_coverage` describes the answer, not the page.
 *
 * The trailing line is the caveat the endpoint has always sent in
 * `data_coverage.note` and the UI has never repeated: with no receipts and no
 * on-hand, this is a forecast of what customers will buy, not a quantity to
 * write on an order.
 */
interface Props {
  coverage: SuggestedCoverage | null;
}

const SOURCES: {
  key: "receipts" | "markdown" | "damage" | "none";
  label: string;
  color: string;
  title: string;
}[] = [
  {
    key: "receipts",
    label: "receipts",
    color: "#1e2a4a",
    title:
      "Every pound that entered and never sold, trim loss included. The best signal there is; needs EDI.",
  },
  {
    key: "markdown",
    label: "markdown",
    color: "#3d5488",
    title:
      "Recorded waste — product that never rang. This is where meat's loss lives.",
  },
  {
    key: "damage",
    label: "damage",
    color: "#7a86a0",
    title:
      "Recorded damage. Narrower than markdown, and used only where an item has no markdowns.",
  },
  {
    key: "none",
    label: "no signal",
    color: "#dfe4ec",
    title: "No waste data for these items, so their order is pure demand.",
  },
];

const CoverageStrip = ({ coverage }: Props) => {
  if (!coverage) return null;
  const by = coverage.items_by_shrink_source;
  const total =
    (by.receipts ?? 0) + (by.markdown ?? 0) + (by.damage ?? 0) + (by.none ?? 0);
  if (total === 0) return null;

  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-2.5 border-b border-gray-100 bg-custom-white">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
        What the waste figure is built from
      </div>

      <div className="flex h-2 rounded-full overflow-hidden my-1.5">
        {SOURCES.map((s) => {
          const n = by[s.key] ?? 0;
          if (n === 0) return null;
          return (
            <div
              key={s.key}
              title={`${n.toLocaleString()} items — ${s.title}`}
              style={{ width: `${(n / total) * 100}%`, background: s.color }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-content/85">
        {SOURCES.map((s) => {
          const n = by[s.key] ?? 0;
          if (n === 0) return null;
          return (
            <span key={s.key} title={s.title} className="flex items-center gap-1.5">
              <i
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: s.color }}
              />
              {n.toLocaleString()} {s.label}
            </span>
          );
        })}
        <span className="ml-auto">
          {coverage.on_hand
            ? "on-hand applied"
            : "no on-hand — a forecast of what will sell, not a stock balance"}
        </span>
      </div>
    </div>
  );
};

export default CoverageStrip;
