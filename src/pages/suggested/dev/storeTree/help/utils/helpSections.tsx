// Interfaces
import type { ReactNode } from "react";

// Components
import Lead from "../components/Lead";
import Formula from "../components/Formula";
import Example from "../components/Example";
import P from "../components/P";
import DayBars from "../components/DayBars";
import Em from "../components/Em";
import Defs from "../components/Defs";
import Note from "../components/Note";
import Pill from "../components/Pill";

/** Sections and contents come from one list, so the jump links cannot drift
 *  from the headings they point at. */
export const SECTIONS: { id: string; q: string; body: ReactNode }[] = [
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
