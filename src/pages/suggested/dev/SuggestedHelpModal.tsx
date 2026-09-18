import { useRef, useState, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../components-dev/modals/ResizableModalShell";

/**
 * The page's explainer, opened from the store panel's "?".
 *
 * Long-form on purpose. The short glossary a popover can hold answers "what is
 * this column"; the questions people actually arrive with are "why is Saturday
 * different from Wednesday" and "does this know what is in my case", and those
 * need a paragraph and a worked example each.
 *
 * Ported from a standalone document, retyped in the app's vocabulary: navy
 * rather than the warm accent it was drawn in, the severity tokens for the
 * source pills, the system stack rather than three webfonts the app does not
 * load, and nothing under 12px.
 *
 * Every figure is the author's and is reproduced verbatim.
 */

/* ── shared bits ──────────────────────────────────────────────────────────── */

const NAVY = "#1e2a4a";

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[14px] leading-[1.65] text-content">{children}</p>
);

/** Emphasis, underlined as well as slanted.
 *
 *  Italic alone is a weak signal at this size and disappears entirely for
 *  anyone reading quickly; the underline is what makes the stressed word
 *  actually register as stressed. */
const Em = ({ children }: { children: ReactNode }) => (
  <em className="italic underline underline-offset-2 decoration-content/40">
    {children}
  </em>
);

/** The opening line of an answer, a step up from the rest.
 *
 *  Twelve answers set at one size read as one undifferentiated block — the
 *  complaint that prompted this. A heavier first sentence gives each section a
 *  topic line a reader can skim, and makes the paragraphs under it feel like
 *  support rather than more of the same. */
const Lead = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-[1.6] text-content font-medium">{children}</p>
);

/** Severity tokens rather than the document's own palette — a reader who has
 *  seen a watch-coloured chip on the grid should meet the same colour here. */
const PILL: Record<string, string> = {
  ok: "bg-severity_healthy_bg text-severity_healthy_text",
  warn: "bg-severity_watch_bg text-severity_watch_text",
  off: "bg-gray-200 text-content/85",
};

const Pill = ({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-[13px] font-semibold whitespace-nowrap ${PILL[tone]}`}
  >
    {children}
  </span>
);

/** A worked example: label on the left, figure on the right, one row emphasised
 *  as the answer. */
const Example = ({
  head,
  rows,
}: {
  head: string;
  rows: { k: string; v: string; out?: boolean }[];
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden bg-custom-white">
    <div className="px-3.5 py-2.5 border-b border-gray-200 bg-gray-50 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1e2a4a]">
      {head}
    </div>
    {rows.map((r) => (
      <div
        key={r.k}
        className={`grid grid-cols-[1fr_auto] gap-4 px-3.5 py-2.5 border-b border-gray-100 last:border-b-0 text-[14px] ${
          r.out ? "bg-gray-100" : ""
        }`}
      >
        <span className={r.out ? "font-bold text-content" : "text-content"}>
          {r.k}
        </span>
        <span
          className={`tabular-nums ${r.out ? "font-bold text-[#1e2a4a] text-[15px]" : "font-medium text-content"}`}
        >
          {r.v}
        </span>
      </div>
    ))}
  </div>
);

const Defs = ({ rows }: { rows: { t: ReactNode; d: ReactNode }[] }) => (
  <dl className="flex flex-col gap-2.5 m-0">
    {rows.map((r, i) => (
      <div key={i} className="grid grid-cols-[8.5rem_1fr] gap-4 items-baseline">
        <dt className="m-0 text-[14px] font-bold text-[#1e2a4a]">{r.t}</dt>
        <dd className="m-0 text-[14px] leading-[1.65] text-content">{r.d}</dd>
      </div>
    ))}
  </dl>
);

const Note = ({ warn, children }: { warn?: boolean; children: ReactNode }) => (
  <div
    className={`border-l-4 px-4 py-3 rounded-r text-[14px] leading-[1.65] ${
      warn
        ? "border-severity_watch_text bg-severity_watch_bg text-severity_watch_text"
        : "border-[#1e2a4a]/30 bg-gray-50 text-content"
    }`}
  >
    {children}
  </div>
);

/** The weekday bars. Same navy as the Production tab's, so the two read as one
 *  chart seen twice rather than two different ones. */
const DAY_ROWS: { n: string; pct: number; lb: string; tone?: "peak" | "low" }[] = [
  { n: "Sunday", pct: 69.6, lb: "802 lb" },
  { n: "Monday", pct: 54.2, lb: "624 lb" },
  { n: "Tuesday", pct: 50.6, lb: "582 lb" },
  { n: "Wednesday", pct: 49.1, lb: "565 lb", tone: "low" },
  { n: "Thursday", pct: 62.2, lb: "716 lb" },
  { n: "Friday", pct: 89.4, lb: "1,029 lb" },
  { n: "Saturday", pct: 100, lb: "1,151 lb", tone: "peak" },
];

const DayBars = () => (
  <div className="flex flex-col gap-1">
    {DAY_ROWS.map((d) => (
      <div
        key={d.n}
        className="grid grid-cols-[6.5rem_1fr_5.5rem] gap-3 items-center text-[14px]"
      >
        <span className="text-content">{d.n}</span>
        <span className="bg-gray-200 rounded-sm h-4 overflow-hidden">
          <span
            className="block h-full rounded-sm"
            style={{
              width: `${d.pct}%`,
              background: d.tone === "low" ? "#8a9bb0" : NAVY,
            }}
          />
        </span>
        <span className="text-right tabular-nums font-medium text-content">{d.lb}</span>
      </div>
    ))}
  </div>
);

/**
 * The model as one line, then its terms.
 *
 * Everything else in this document is prose about the formula; without the
 * formula itself a reader has to assemble it from twelve answers. It is the
 * endpoint's own expression, not a paraphrase:
 *
 *     suggested_weight = demand(cover window, by weekday) x shrink - on_hand
 */
const Formula = () => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
    <div className="px-3.5 py-3 border-b border-gray-200 bg-custom-white">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] tabular-nums">
        <span className="font-bold text-[#1e2a4a]">Suggested weight</span>
        <span className="text-content/85">=</span>
        <span className="font-semibold text-content">demand</span>
        <span className="text-content/85">&times;</span>
        <span className="font-semibold text-content">waste</span>
        <span className="text-content/85">&minus;</span>
        <span className="font-semibold text-content">stock on hand</span>
      </div>
    </div>
    <dl className="m-0 divide-y divide-gray-200">
      {[
        {
          t: "demand",
          d: "This item's rate for each weekday the delivery covers, added up. A four-day order over a weekend adds four weekend rates, not four average days.",
        },
        {
          t: "weekday rate",
          d: "Pounds this item sold on that weekday across the lookback, divided by how many times that weekday came round in it — twelve Fridays, not the number of Fridays it happened to sell on.",
        },
        {
          t: "waste",
          d: "1 plus that item's own recorded waste rate. 1.00 where there is no record, and capped where the raw rate exceeds what waste can plausibly be.",
        },
        {
          t: "stock on hand",
          d: "What was ordered and has not sold yet, subtracted so you are not buying it twice. Measured over the days this order has to cover, not the whole lookback — stock is a level, and a figure that grows the further back you look is not one.",
        },
      ].map((r) => (
        <div key={r.t} className="grid grid-cols-[8.5rem_1fr] gap-4 px-3.5 py-2.5">
          <dt className="m-0 text-[14px] font-bold text-[#1e2a4a]">{r.t}</dt>
          <dd className="m-0 text-[14px] leading-[1.6] text-content">{r.d}</dd>
        </div>
      ))}
    </dl>
    <div className="px-3.5 py-2.5 border-t border-gray-200 text-[13px] leading-snug text-content/85">
      The result is floored at zero — the model never asks for a negative order.
    </div>
  </div>
);

/* ── the questions ────────────────────────────────────────────────────────── */

/** Sections and contents come from one list, so the jump links cannot drift
 *  from the headings they point at. */
const SECTIONS: { id: string; q: string; body: ReactNode }[] = [
  {
    id: "q1",
    q: "Where does the suggested figure come from?",
    body: (
      <>
        <Lead>
          Three steps. It starts with what this item actually sold, on the
          specific days the delivery has to cover, then adds back what typically
          gets lost before it reaches a customer.
        </Lead>
        <Formula />
        <Example
          head="Pork Shoulder Steak · covering Friday to Monday"
          rows={[
            { k: "Sold over the last 12 weeks", v: "5,149 lb" },
            { k: "Which averages per day", v: "61.3 lb" },
            { k: "Friday + Saturday + Sunday + Monday rates", v: "313.2 lb" },
            { k: "Waste adjustment", v: "× 1.00" },
            // Spelled out rather than left off. The term is in the formula
            // directly above, and an example that silently skips one line of it
            // reads as the formula being wrong.
            { k: "Ordered and not yet sold", v: "none recorded" },
            { k: "Suggested", v: "313 lb", out: true },
          ]}
        />
        <P>
          Four days at the flat daily average would have been 245 lb. The weekend
          is worth 68 lb on this cut alone.
        </P>
      </>
    ),
  },
  {
    id: "q2",
    q: "Why is Saturday so different from Wednesday?",
    body: (
      <>
        <Lead>
          Because it is. Every figure on this page is worked out per weekday
          rather than as one daily average, because a case doesn&rsquo;t sell
          evenly across the week and ordering as though it does costs you both
          ways.
        </Lead>
        <DayBars />
        <P>
          This is Meat by # at one store.{" "}
          <b className="font-semibold">Saturday runs at twice Wednesday.</b> The
          daily average is 781 lb &mdash; a number that is 26% too high for a
          Wednesday and 47% too low for a Saturday.
        </P>
        <P>
          So an order covering a weekend is priced at weekend rates, and one
          covering midweek isn&rsquo;t.
        </P>
      </>
    ),
  },
  /* ── YEAR OVER YEAR — commented out, not deleted ──────────────────────────
   *
   * Both of these describe a comparison mode the UI does not have yet. The
   * second promises a control that was removed with the date picker, and the
   * first argues for the model using a year the page cannot show anyone. Help
   * text that describes a feature nobody can reach is worse than no help text:
   * a reader who goes looking and finds nothing stops trusting the rest.
   *
   * Restore both when the year-over-year work lands. `setAsOf` in the slice is
   * the seam it plugs into, and the copy below is unchanged.
   *
   *   {
   *     id: "qyoy",
   *     q: "Can I trust the weekday pattern?",
   *     body: (
   *       <>
   *         <Lead>
   *           Fair question &mdash; a pattern pulled out of twelve weeks could just be
   *           twelve weeks of coincidence. So we checked it against a year it had
   *           never seen.
   *         </Lead>
   *         <P>
   *           Same department, same store, same weeks of the calendar, one year apart.
   *           Here is each day&rsquo;s share of its own week, then and now:
   *         </P>
   *         <Example
   *           head="Meat by # · share of the week · last year → this year"
   *           rows={[
   *             { k: "Sunday", v: "14.6% → 14.7%" },
   *             { k: "Monday", v: "12.0% → 11.4%" },
   *             { k: "Tuesday", v: "12.1% → 10.6%" },
   *             { k: "Wednesday", v: "10.9% → 10.3%" },
   *             { k: "Thursday", v: "13.5% → 13.1%" },
   *             { k: "Friday", v: "17.6% → 18.8%" },
   *             { k: "Saturday", v: "19.2% → 21.1%", out: true },
   *           ]}
   *         />
   *         <P>
   *           Every day landed within about a point and a half of where it was.
   *           Saturday was the peak both years, Wednesday the trough both years, and
   *           the order of the seven days didn&rsquo;t change &mdash; while the
   *           department sold 50% more meat overall.
   *         </P>
   *         <P>
   *           The weekend is a slightly bigger share of the week now than it was, not
   *           a smaller one. Whatever else moved, the shape of the week held.
   *         </P>
   *       </>
   *     ),
   *   },
   *   {
   *     id: "qlast",
   *     q: "Can I look at the same week last year?",
   *     body: (
   *       <>
   *         <Lead>
   *           Yes. Set the date to a day that has already passed and the screen
   *           switches into comparison mode: the same weekday rates, the same daily
   *           history, the same not-selling list &mdash; for that point in the
   *           calendar.
   *         </Lead>
   *         <Note>
   *           In comparison mode there is <b className="font-semibold">no suggested
   *           weight</b>, on purpose. A pounds-to-order figure worked out for last
   *           September isn&rsquo;t something anyone should be able to read off a
   *           screen and act on. You get the history to compare against; the ordering
   *           number only appears for a date you can still order for.
   *         </Note>
   *         <P>
   *           It is most useful on the seasonal lines. If cherries came off in the
   *           second week of September last year, that&rsquo;s a date you can look up
   *           rather than a thing you have to remember.
   *         </P>
   *       </>
   *     ),
   *   },
   */
  {
    id: "q3",
    q: "What do days until delivery and cover days change?",
    body: (
      <>
        <Lead>
          Together they decide <Em>which calendar days</Em> the order has to pay
          for &mdash; and because the week isn&rsquo;t flat, that changes the
          number.
        </Lead>
        <Defs
          rows={[
            {
              t: "Days until delivery",
              d: "How long between placing the order and it arriving. Moves the window forward.",
            },
            {
              t: "Cover days",
              d: "How long the delivery has to cover, until the next one arrives. Sets how wide the window is.",
            },
          ]}
        />
        <P>
          Order on Wednesday with 2 and 4 and you are buying for Friday through
          Monday. Change the first to 5 and the same four-day order now covers
          Monday to Thursday &mdash; all midweek, and the figure drops, even
          though nothing else moved.
        </P>
        <Note>
          Cover days runs <Em>to</Em> your next delivery, not through it.
          Whatever your rhythm, the day the next truck lands is that
          order&rsquo;s to cover, not this one&rsquo;s &mdash; count it in both
          and you buy it twice.
        </Note>
      </>
    ),
  },
  {
    id: "q4",
    q: "What is the waste adjustment?",
    body: (
      <>
        <Lead>
          Sales tell you what customers took home. They don&rsquo;t tell you about
          trim loss, spoilage, or product marked down and thrown out. Order to
          sales alone and you come up short every cycle by whatever never reached
          the register.
        </Lead>
        <P>
          So the figure is lifted by that item&rsquo;s own recorded waste rate.
          Each row says which record it used:
        </P>
        <Defs
          rows={[
            {
              t: <Pill tone="warn">markdown</Pill>,
              d: "Recorded waste for this item. The usual source, and the one that covers meat.",
            },
            {
              t: <Pill tone="warn">damage</Pill>,
              d: "Recorded damage, where there’s no markdown history.",
            },
            {
              t: <Pill tone="ok">receipts</Pill>,
              d: "Weight delivered against weight sold — the most complete measure. Available once the vendor delivery feed is connected.",
            },
            {
              t: <Pill tone="off">none</Pill>,
              d: "No waste record. The figure is sales only, and will run low.",
            },
          ]}
        />
        <P>
          A mixed berry bowl selling 11.9 lb over the window comes back at 13.2
          &mdash; roughly a tenth of it historically gets thrown out, so ordering
          to demand alone leaves the case short.
        </P>
      </>
    ),
  },
  {
    id: "q5",
    q: "Why do some items say no adjustment?",
    body: (
      <>
        <Lead>
          Because nothing has been recorded as wasted for that item. It
          doesn&rsquo;t mean nothing is being lost &mdash; it means there&rsquo;s
          no record to measure.
        </Lead>
        <P>
          Those rows are a sales forecast rather than a full order figure, and
          they will tend to run low. If a cut you know throws off a lot of trim
          shows <Pill tone="off">none</Pill>, that&rsquo;s worth knowing when you
          read its number.
        </P>
      </>
    ),
  },
  {
    id: "q6",
    q: "Does this know what’s already in my case?",
    body: (
      <>
        <Lead>
          <b className="font-semibold">Yes, as far as the records go.</b> What
          was ordered and hasn&rsquo;t sold yet comes off the suggestion before
          you see it.
        </Lead>
        <P>
          It compares what was ordered against what was sold over the days this
          order has to cover, and subtracts the difference. Not the whole twelve
          weeks &mdash; stock is a <Em>level</Em>, and a figure that gets bigger
          the further back you look is not one.
        </P>
        <Example
          head="Pork Shoulder Steak · 2 days until delivery, 4 cover days"
          rows={[
            { k: "Friday + Saturday + Sunday + Monday rates", v: "313.2 lb" },
            { k: "Waste adjustment", v: "× 1.00" },
            { k: "Ordered and not yet sold, last 6 days", v: "− 48.0 lb" },
            { k: "Suggested", v: "265 lb", out: true },
          ]}
        />
        <P>
          Open any row to see its own version of that sum, including how many
          days of selling the stock on hand works out to.
        </P>
        <Note warn>
          It is only as good as what got written down. Where receiving weight
          isn&rsquo;t recorded, this reads as no stock and comes off as zero
          &mdash; which leaves the figure where it was before, rather than
          somewhere wrong. Still worth a look in the case before you send it.
        </Note>
      </>
    ),
  },
  {
    id: "q6b",
    q: "What are the actions telling me to do?",
    body: (
      <>
        <Lead>
          The suggested weight is how much to buy. The action beside it is about
          the <Em>rhythm</Em> &mdash; how often, and how much each time.
        </Lead>
        <P>
          It turns on one figure: how many days the stock on hand would last at
          the rate the item sells. That gets compared against what one delivery
          has to carry, which is your days until delivery plus your cover days.
          Six days of stock is comfortable on a weekly delivery and two
          orders&rsquo; worth on a Tuesday/Friday one, which is why it is always
          measured against your own cycle rather than a fixed number of days.
        </P>
        <Defs
          rows={[
            {
              t: "Slow the ordering",
              d: "Over a cycle of stock sitting there, and buying has run well ahead of selling all quarter. Both readings agree, which is what makes it worth acting on. Order less now and less again next time.",
            },
            {
              t: "Skip this order",
              d: "Over a cycle of stock, but the buying itself is in line. Nothing is wrong with the rhythm — this particular turn just isn't needed.",
            },
            {
              t: "Buy more",
              d: "Under a quarter of a cycle in the case, and less has been bought than sold over the quarter. The case is emptying before the next truck lands.",
            },
            {
              t: "Deliver more often",
              d: "Running short, and one weekday does half again the item's normal volume. Ordering more won't fix that — the extra just sits through the slow days. A delivery closer to the busy day will.",
            },
            {
              t: "Watch",
              d: "The trend is wrong while today's number is fine. Doing nothing this cycle costs nothing; it's the direction worth knowing about.",
            },
            {
              t: "Nothing to do",
              d: "A real answer, not a blank. Stock, buying and waste all read normally for this item.",
            },
          ]}
        />
        <Note>
          Three more chips aren&rsquo;t about rhythm at all.{" "}
          <b className="font-semibold">Selling less</b> and{" "}
          <b className="font-semibold">Stopped selling</b> mean the forecast is
          running ahead of where the item actually is.{" "}
          <b className="font-semibold">Check item codes</b> and{" "}
          <b className="font-semibold">No waste logged</b> are about the records
          rather than the order. Each row&rsquo;s popover says which kind it is.
        </Note>
      </>
    ),
  },
  {
    id: "q7",
    q: "What does the not-selling list mean?",
    body: (
      <>
        <Lead>
          The other half of the question. It compares the last four weeks against
          the eight before them, and flags two things:
        </Lead>
        <Defs
          rows={[
            {
              t: "Stopped",
              d: "Was selling, has sold nothing in four weeks. One store had a family pack T-bone moving 7.9 lb a day that has since sold nothing at all.",
            },
            {
              t: "Declining",
              d: "Still selling, but well down — smoked picnic went from 6.1 lb a day to 0.4.",
            },
          ]}
        />
        <P>
          Declining is usually the more useful of the two. Something that stopped
          is generally noticed; something still moving at a fraction of its old
          rate is often still being produced to the old level, and the difference
          is being thrown away right now.
        </P>
        <P>
          The list is ordered by how much the item used to sell, so the biggest
          thing that slipped is at the top.
        </P>
        <P>
          A lot of what shows up is seasonal, and you&rsquo;ll know most of it
          before the screen tells you &mdash; the cherries are done, the
          home-grown tomatoes are done. That&rsquo;s worth having anyway: it puts
          the seasonal exits in front of you at the moment they happen, and the
          declines that <Em>aren&rsquo;t</Em> seasonal stand out against the ones
          that are.
        </P>
      </>
    ),
  },
  {
    id: "q8",
    q: "Is my store low, or is everyone low?",
    body: (
      <>
        <Lead>
          Switch to the group view and you get one line per store per department,
          so a department can be read against the same department everywhere else.
          A store that looks weak on its own often turns out to be in line with
          the group in a slow week.
        </Lead>
        <Note>
          One thing to watch: a store carrying three meat items will always look
          far below one carrying 170. Compare pounds per item, or check the item
          count before reading anything into the gap.
        </Note>
      </>
    ),
  },
  {
    id: "q9",
    q: "Why is an item marked as a data problem?",
    body: (
      <>
        <Lead>
          Some items record more waste than they ever sold &mdash; one store shows
          tuna steaks at over four times, catfish at over three. That isn&rsquo;t
          waste, it&rsquo;s the item being received under one code and sold under
          another.
        </Lead>
        <P>
          Where that happens the adjustment is capped and the row is flagged, so a
          keying problem doesn&rsquo;t quietly inflate an order. It&rsquo;s worth
          passing those on &mdash; they usually point at something fixable in how
          the item is set up.
        </P>
      </>
    ),
  },
  {
    id: "q10",
    q: "How far back does it look?",
    body: (
      <>
        <Lead>
          Twelve weeks by default. That&rsquo;s long enough that one holiday or one
          ad week doesn&rsquo;t distort a weekday rate, and each day of the week
          gets twelve readings behind it.
        </Lead>
        <P>
          The trade-off is worth knowing: twelve weeks back from September reaches
          mid-June, so a shoulder-season item can carry some summer in its
          figure. If a seasonal line looks high, that is usually why.
        </P>
        <P>
          You can shorten or lengthen the window. Shorter reacts faster to a real
          change; longer is steadier and less easily thrown by one odd week.
          Twelve is the middle of that trade.
        </P>
      </>
    ),
  },
];

/* ── the modal ────────────────────────────────────────────────────────────── */

const SuggestedHelpModal = ({ onClose }: { onClose: () => void }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  /**
   * Jump links, done with `scrollIntoView` rather than an `href="#id"`.
   *
   * A bare hash scrolls whichever element is the scrolling ancestor. Inside a
   * modal that is usually the panel, but where it is not, the PAGE behind the
   * modal moves instead and the modal appears frozen. A hash write can also
   * collide with the app's router. `scrollIntoView` finds the right container
   * on its own and changes no URL state.
   */
  const jump = (id: string) => {
    const target = scroller.current?.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    // Focus so keyboard and screen-reader users land where sighted ones do.
    target.focus({ preventScroll: true });

    // Brief mark on the heading: the scroll happens inside the panel, so
    // without a cue it is not obvious anything moved.
    setLanded(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLanded(null), 1700);
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="help-modal:suggested:v1"
      defaultWidth={880}
      defaultHeight={860}
    >
      <div
        className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between"
        style={{ background: NAVY }}
      >
        <div>
          <div className="text-[15px] font-bold text-custom-white">
            Reading Suggested Weight
          </div>
          <div className="text-[13px] font-normal text-custom-white/85 mt-0.5">
            How the number is worked out, what it covers, and what it doesn&rsquo;t.
          </div>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* A tray, so the answer cards below have something to lift off. */}
      <div
        ref={scroller}
        className="flex-1 overflow-y-auto thin-scrollbar bg-gray-50 px-5 py-5"
      >
        <nav className="rounded-lg border border-gray-200 bg-custom-white shadow-md px-4 py-3.5 mb-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#1e2a4a] mb-2.5">
            Questions
          </div>
          <ol className="flex flex-col gap-1.5 m-0 p-0 list-none">
            {SECTIONS.map((sec, i) => (
              <li key={sec.id}>
                <button
                  onClick={() => jump(sec.id)}
                  className="group w-full text-left flex items-baseline gap-3"
                >
                  <span className="w-5 flex-shrink-0 text-[13px] font-bold tabular-nums text-[#1e2a4a]/50 group-hover:text-[#1e2a4a] transition-colors">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-content group-hover:text-[#1e2a4a] group-hover:underline underline-offset-2 transition-colors">
                    {sec.q}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {SECTIONS.map((sec, i) => (
          <section
            key={sec.id}
            id={sec.id}
            // -1 keeps it focusable for the jump without putting a block of
            // text into the tab order.
            tabIndex={-1}
            className={`rounded-lg border bg-custom-white shadow-md outline-none mb-4 transition-colors duration-700 ${
              landed === sec.id ? "border-[#1e2a4a]/40" : "border-gray-200"
            }`}
            style={{ scrollMarginTop: "0.5rem" }}
          >
            {/* Question band, then the answer. One card per question is what
                makes this read as a Q&A rather than a page with rules through
                it — twelve headings on one surface all carried the same weight
                however they were set. The numeral matches the contents list,
                same twelve in the same order, so it is structure rather than
                ornament. */}
            <div className="flex items-baseline gap-3 px-5 pt-4 pb-3.5 border-b border-gray-100">
              <span
                className={`w-6 flex-shrink-0 text-[13px] font-bold tabular-nums text-custom-white rounded text-center py-0.5 transition-colors duration-700 ${
                  landed === sec.id ? "bg-[#1e2a4a]" : "bg-[#1e2a4a]/55"
                }`}
              >
                {i + 1}
              </span>
              <h2
                className={`text-[19px] font-bold leading-snug m-0 tracking-[-0.01em] transition-colors duration-700 ${
                  landed === sec.id ? "text-[#1e2a4a]" : "text-content"
                }`}
              >
                {sec.q}
              </h2>
            </div>
            <div className="flex flex-col gap-3.5 px-5 py-4">{sec.body}</div>
          </section>
        ))}

        <footer className="px-1 pt-2 pb-1 text-[13px] leading-relaxed text-content/85">
          Figures shown are real, from one store over a twelve-week window.
          Departments covered are the ones that sell by the pound &mdash; meat,
          produce and deli scale items.
        </footer>
      </div>
    </ResizableModalShell>
  );
};

export default SuggestedHelpModal;
