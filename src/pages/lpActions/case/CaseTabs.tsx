import { colourFor, MUTED_OPACITY } from "./chartTheme";
import { isAll } from "./caseModel";
import type { CaseType } from "./caseModel";

/**
 * The type switcher, and the cross-type picture in one row.
 *
 * Every type this cashier touched is shown, including the calm ones. A tab
 * reading "Voided 1.1×" is not clutter — it is the sentence "this is specific
 * to refunds, not a general pattern with this operator", which is the first
 * thing a manager needs before opening a conversation.
 *
 * All leads, because the operator is the question and the type is the answer.
 * It carries no swatch: it is not a series on the charts, it is the absence of
 * a filter over them.
 *
 * Every other tab carries its series swatch, so the strip is also the charts'
 * legend — the thing you clicked and the line that thickened are visibly the
 * same thing, one above the other, rather than two colour systems for one set
 * of labels.
 */
interface Props {
  all: CaseType;
  types: CaseType[];
  selected: string;
  onSelect: (saleType: string) => void;
}

const label = (t: CaseType) =>
  t.multiplier === null
    ? "new"
    : t.multiplier >= 1
      ? `${t.multiplier.toFixed(t.multiplier >= 10 ? 0 : 1)}×`
      : `−${Math.round((1 - t.multiplier) * 100)}%`;

const TONE: Record<string, string> = {
  investigate: "text-severity_critical_text",
  watch: "text-severity_watch_text",
  steady: "text-content/85",
};

const CaseTabs = ({ all, types, selected, onSelect }: Props) => {
  const names = types.map((t) => t.saleType);

  return (
    <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0 overflow-x-auto thin-scrollbar">
      {[all, ...types].map((t) => {
        const on = t.saleType === selected;
        return (
          <button
            key={t.saleType}
            onClick={() => onSelect(t.saleType)}
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              on ? "border-[#1e2a4a] text-content" : "border-transparent"
            }`}
          >
            {!isAll(t.saleType) && (
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{
                  background: colourFor(names, t.saleType),
                  opacity: on ? 1 : MUTED_OPACITY,
                }}
              />
            )}
            <span className="text-content">{t.saleType}</span>
            <span className={`tabular-nums ${TONE[t.severity]}`}>
              {label(t)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CaseTabs;
