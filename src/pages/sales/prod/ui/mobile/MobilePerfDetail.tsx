import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

export interface DetailTab<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  /**
   * The breakdowns on offer.
   *
   * One tab renders no tab row: a single tab is a label pretending to be a
   * control, and the header already names what you are looking at.
   */
  tabs: DetailTab<K>[];
  active: K;
  onTab: (key: K) => void;
  /** What every row below belongs to — the store, the department, the person.
   *  This is the thing a row is meaningless without. */
  scopeName: string;
  /** The window, or the day the card was scoped to. */
  when: string;
  /** Where Back goes, named. */
  backLabel: string;
  onBack: () => void;
  /** Names the level on screen. Changing it starts the new list at its top. */
  levelKey: string;
  children: ReactNode;
}

/**
 * A breakdown, as its own screen.
 *
 * The card that sends you here is a summary, and a breakdown is a list — often
 * a long one. Opening it inside the card pushed the report it explains off the
 * top of the screen and left the reader scrolling a card to read a list, which
 * is the worst of both. Here the list gets the viewport and the card keeps its
 * job.
 *
 * The header is fixed and names the scope rather than the breakdown alone,
 * because that is what a row needs to mean anything — "Grocery, −6.6%" says
 * nothing until you know whose Grocery. Back returns to the list with the card
 * still open and the selection intact.
 *
 * Deliberately knows nothing about any page's state: the tabs, the labels and
 * the scope all arrive as props, so Sales' Sub Depts / Hours and Sub Dept
 * Margins' single Items list are the same component.
 */
const MobilePerfDetail = <K extends string>({
  tabs,
  active,
  onTab,
  scopeName,
  when,
  backLabel,
  onBack,
  levelKey,
  children,
}: Props<K>) => {
  const scroller = useRef<HTMLDivElement>(null);

  // Switching breakdown, or opening a row's own level, is a different list —
  // it starts at its own top rather than wherever the last one was read to.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [levelKey]);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      <header className="flex-shrink-0 border-b border-gray-200 bg-custom-white px-3 pb-2.5 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold text-content active:bg-bkg"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {backLabel}
        </button>
        <p className="truncate font-display text-[15px] font-bold text-content">
          {scopeName}
        </p>
        <p className="font-mono text-[11px] tracking-tight text-content/85">
          {when}
        </p>

        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label="Breakdown"
            className="mt-2 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map((t) => {
              const on = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => onTab(t.key)}
                  className={`rounded-lg border py-2 text-[11.5px] font-bold transition-colors ${
                    on
                      ? "border-[#1e2a4a] bg-[#1e2a4a] text-custom-white"
                      : "border-gray-200 bg-bkg text-content active:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row. */}
      <div ref={scroller} className="flex-1 overflow-y-auto pb-14">
        <div className="p-3">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MobilePerfDetail;
