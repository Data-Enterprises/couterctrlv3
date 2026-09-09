import { useRef, useState, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../components/modals/ResizableModalShell";

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
        <Example
          head="Pork Shoulder Steak · covering Friday to Monday"
          rows={[
            { k: "Sold over the last 12 weeks", v: "5,149 lb" },
            { k: "Which averages per day", v: "61.3 lb" },
            { k: "Friday + Saturday + Sunday + Monday rates", v: "313.2 lb" },
            { k: "Waste adjustment", v: "× 1.00" },
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
  {
    id: "qyoy",
    q: "Can I trust the weekday pattern?",
    body: (
      <>
        <Lead>
          Fair question &mdash; a pattern pulled out of twelve weeks could just be
          twelve weeks of coincidence. So we checked it against a year it had
          never seen.
        </Lead>
        <P>
          Same department, same store, same weeks of the calendar, one year apart.
          Here is each day&rsquo;s share of its own week, then and now:
        </P>
        <Example
          head="Meat by # · share of the week · last year → this year"
          rows={[
            { k: "Sunday", v: "14.6% → 14.7%" },
            { k: "Monday", v: "12.0% → 11.4%" },
            { k: "Tuesday", v: "12.1% → 10.6%" },
            { k: "Wednesday", v: "10.9% → 10.3%" },
            { k: "Thursday", v: "13.5% → 13.1%" },
            { k: "Friday", v: "17.6% → 18.8%" },
            { k: "Saturday", v: "19.2% → 21.1%", out: true },
          ]}
        />
        <P>
          Every day landed within about a point and a half of where it was.
          Saturday was the peak both years, Wednesday the trough both years, and
          the order of the seven days didn&rsquo;t change &mdash; while the
          department sold 50% more meat overall.
        </P>
        <P>
          The weekend is a slightly bigger share of the week now than it was, not
          a smaller one. Whatever else moved, the shape of the week held.
        </P>
      </>
    ),
  },
  {
    id: "qlast",
    q: "Can I look at the same week last year?",
    body: (
      <>
        <Lead>
          Yes. Set the date to a day that has already passed and the screen
          switches into comparison mode: the same weekday rates, the same daily
          history, the same not-selling list &mdash; for that point in the
          calendar.
        </Lead>
        <Note>
          In comparison mode there is <b className="font-semibold">no suggested
          weight</b>, on purpose. A pounds-to-order figure worked out for last
          September isn&rsquo;t something anyone should be able to read off a
          screen and act on. You get the history to compare against; the ordering
          number only appears for a date you can still order for.
        </Note>
        <P>
          It is most useful on the seasonal lines. If cherries came off in the
          second week of September last year, that&rsquo;s a date you can look up
          rather than a thing you have to remember.
        </P>
      </>
    ),
  },
  {
    id: "q3",
    q: "What do lead days and cover days change?",
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
              t: "Lead days",
              d: "How long between placing the order and it arriving. Moves the window forward.",
            },
            {
              t: "Cover days",
              d: "How long the delivery has to last, until the next one. Sets how wide the window is.",
            },
          ]}
        />
        <P>
          Order on Wednesday with 2 lead days and 4 cover days and you are buying
          for Friday through Monday. Change lead days to 5 and the same four-day
          order now covers Monday to Thursday &mdash; all midweek, and the figure
          drops, even though nothing else moved.
        </P>
        <Note>
          The two should add up to how you actually order. Ordering Wednesday for
          Friday, then again Saturday for Monday, is 2 lead and{" "}
          <b className="font-semibold">3</b> cover &mdash; not 4, or Monday gets
          bought twice.
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
          <b className="font-semibold">No.</b> Nothing here can see your current
          stock, and nothing here knows what&rsquo;s already on a truck.
        </Lead>
        <P>
          What you&rsquo;re looking at is how much the case is expected to move
          over those days, adjusted for waste. Subtracting what&rsquo;s already on
          hand is still your call.
        </P>
        <Note warn>
          Treat it as the starting figure, not the order. It answers &ldquo;how
          much will this sell&rdquo;, not &ldquo;how much more do I need&rdquo;.
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
          home-grown tomatoes are done. That&rsquo;s worth having anyway: the same
          exits repeat within a week or two of the same dates each year, so you
          can check a date instead of recalling it, and the declines that{" "}
          <Em>aren&rsquo;t</Em> seasonal stand out against the ones that are.
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
          mid-June, so a shoulder-season item can carry some summer in its figure.
          If a seasonal line looks high, that&rsquo;s usually why &mdash; and
          pulling up the same week last year will normally confirm it.
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
