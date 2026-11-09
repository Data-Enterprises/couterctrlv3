// Utils
import { CAUSE_LABEL } from "../utils/deptInvestigation";

// Interfaces
import type { Summary, InvestigationTab } from "../interfaces";
import type { Desk, Holds, Supply } from "../utils/investigationSteps";

// Components
import Bar from "./Bar";

/** The investigation's tab bar: the steps as tabs, each showing its conclusion once it has one,
 *  or what it is waiting for while orders and deliveries load. */
/*
  The steps, as tabs.

  One scrolling page would put the hand-off below three hundred rows of
  grid, where only a shortcut reaches it. The three split on the WAVE
  boundary: the first needs sales alone and draws at once, the other
  two wait for orders and deliveries — so a tab that is not ready says
  what it is waiting for rather than showing a figure that will move.

  Each carries its own conclusion once it has one, so the bar is a
  summary of the whole notebook and not just a way to move around it.
*/
const InvestigationTabs = ({
  tab,
  onTab,
  salesIn,
  allIn,
  holds,
  summary,
  supply,
  desks,
}: {
  tab: InvestigationTab;
  onTab: (t: InvestigationTab) => void;
  salesIn: boolean;
  allIn: boolean;
  holds: Holds;
  summary: Summary;
  supply: Supply;
  desks: Desk[];
}) => {
  /**
   * The bar's own content.
   *
   * Named for what each one IS rather than for the question it answers:
   * three questions in a row read as a quiz, and numbering them 1, 3 and 5
   * left two gaps nobody could account for. The conclusion beneath each name
   * is where the question gets answered.
   *
   * `answer` is a thunk because a tab that is still waiting must not
   * evaluate a conclusion it does not have yet.
   */
  /* The conclusion a tab has reached, in as few words as will carry it.
     These are read four at a time across the top of the page, so a phrase
     that is fine on its own becomes a paragraph here — the tab says what it
     found, and the tab itself says the rest. */
  const TABS = [
    {
      key: "holds" as const,
      title: "Summary",
      needsAll: false,
      answer: () => (holds.verdict === "holds" ? "Holds" : "Doesn’t hold"),
    },
    {
      key: "items" as const,
      title: "Items",
      needsAll: true,
      answer: () => {
        const lead = summary.byCause.find(
          (c) => c.cause !== "ahead" && c.dollars < 0,
        );
        return lead ? CAUSE_LABEL[lead.cause] : "Nothing behind";
      },
    },
    {
      key: "supply" as const,
      title: "Supply",
      needsAll: true,
      answer: () => `${supply.mine.orders} vs ${supply.theirs.orders} orders`,
    },
    {
      key: "act" as const,
      title: "Hand-off",
      needsAll: true,
      answer: () => {
        const owned = desks.filter((d) => d.actionable);
        return owned.length
          ? `${owned.length} ${owned.length === 1 ? "list" : "lists"}`
          : "No lists";
      },
    },
  ];

  return (
    <div
      data-help="tabs"
      className="flex-shrink-0 grid grid-cols-4 border-b border-brand_navy/15 animate-nb-drop motion-reduce:animate-none"
      style={{ animationDelay: "70ms" }}
    >
      {TABS.map((t) => {
        const waiting = t.needsAll ? !allIn : !salesIn;
        const on = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            aria-current={on}
            className={`text-left px-4 py-2 border-b-2 transition-colors min-w-0 ${
              on
                ? "border-brand_navy bg-custom-white"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2">
              {/* Ready or not, without spending a numeral on it. */}
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  waiting
                    ? "border border-content/40"
                    : on
                      ? "bg-brand_navy"
                      : "bg-content/40"
                }`}
              />
              <span className="text-[13.5px] font-bold text-content">
                {t.title}
              </span>
            </span>
            {/* A bar rather than a word. "Waiting on orders" under four
                tabs at once read as four problems; a bar is plainly a
                figure that has not arrived. */}
            {waiting ? (
              <span className="block mt-1.5 mb-1 pl-[15px]">
                <Bar w="72%" h={10} />
              </span>
            ) : (
              <span className="block text-[12px] mt-0.5 truncate text-content/85">
                {t.answer()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default InvestigationTabs;
