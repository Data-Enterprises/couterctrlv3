import type { AllOrder } from "../../../interfaces";
import { getCogs, getERet } from ".";

/**
 * Editing an order, as data.
 *
 * The page holds one draft and this module is every rule about it, so the
 * components below never decide what an edit means. Two things shape all of
 * it:
 *
 * `update_file` does not write to the `orders` table — it builds a CSV, drops
 * it in the provider import bucket and logs the drop. So a save is a
 * submission, not a write, and re-reading the order afterwards still returns
 * the old figures until the import runs. Nothing here refetches.
 *
 * And the endpoint rejects the whole request on four conditions: one storeid
 * across every line, `(order_id, line_number)` unique, one `order_date` day,
 * and at least one line. A draft is scoped to a single order rather than to
 * whatever the configuration panel is showing, which makes the first three
 * true by construction instead of by validation.
 */

/**
 * The fields an edit may touch. Everything else rides along.
 *
 * Weight is one of them because on a scalable item it is what the money is
 * worked out from: `getCogs` and `getERet` both multiply by weight rather
 * than by qty when `scalable` is set, so an editable qty with a fixed weight
 * would leave the ext columns refusing to move on half the lines in a meat
 * order.
 */
export const EDITABLE = [
  "qty",
  "weight",
  "base_cost",
  "active_retail_price",
] as const;
export type EditableField = (typeof EDITABLE)[number];

export const FIELD_LABEL: Record<EditableField, string> = {
  qty: "Qty",
  weight: "Weight",
  base_cost: "Case cost",
  active_retail_price: "Retail",
};

/** One order: one store, one date, one order number. */
export type OrderDoc = {
  key: string;
  storeid: number;
  storenumber: string;
  storename: string;
  /** ISO, exactly as it arrived — the backend reformats it itself. */
  order_date: string;
  order_id: number;
  order_type: string;
  lineCount: number;
};

export type DraftLine = AllOrder & {
  /**
   * The three editable values as they arrived, for the revert and the "was"
   * note. Null on a line added here, which has nothing to go back to.
   */
  original: Pick<AllOrder, EditableField> | null;
};

export type OrderDraft = {
  doc: OrderDoc;
  lines: DraftLine[];
  /**
   * Bumped when a value is replaced from outside the field it lives in — a
   * revert, or the lookup filling an added line.
   *
   * The three editable cells are uncontrolled inputs, because a controlled
   * number input rewrites what is in the box on every keystroke: it moves the
   * caret to the end mid-number and formatting a half-typed "5" to "5.00"
   * makes the next digit land in the wrong place. Uncontrolled means React
   * has to be told when the value changed underneath it, which is what this
   * is for — the cells key on it, so a revert remounts them and a keystroke
   * does not.
   */
  resetNonce: number;
};

export const isAdded = (l: DraftLine) => l.original === null;

export const isEdited = (l: DraftLine) =>
  l.original !== null && EDITABLE.some((k) => l[k] !== l.original![k]);

export const isChanged = (l: DraftLine) => isAdded(l) || isEdited(l);

export const editedLines = (d: OrderDraft) => d.lines.filter(isEdited);
export const addedLines = (d: OrderDraft) => d.lines.filter(isAdded);
export const changedLines = (d: OrderDraft) => d.lines.filter(isChanged);
/**
 * Added lines that are not lines yet — what holds the save back.
 *
 * Read off the fields rather than off a "the lookup answered" flag, because
 * an added line is filled in by hand as often as it is looked up: on a
 * desktop there is nothing to scan with, and the lookup is a head start, not
 * the way in. The two that have to be there are the item and the vendor —
 * `vendor_id` is `NOT NULL` on the order, and a line with no product code is
 * not a line at all.
 */
export const isBlank = (l: DraftLine) =>
  isAdded(l) && (!String(l.product_code).trim() || !String(l.vendor_id).trim());

export const blankLines = (d: OrderDraft) => d.lines.filter(isBlank);

/**
 * Which order a line belongs to.
 *
 * The storeid is part of it because order numbers are only unique within a
 * store, and the date because the same number can come round again.
 */
export const docKey = (
  o: Pick<AllOrder, "storeid" | "order_id" | "order_date">,
) => `${o.storeid}|${o.order_id}|${o.order_date}`;

/**
 * The orders in the result, for the picker.
 *
 * Read off the lines the page already holds rather than asked for: dev Orders
 * fetches every line in the range from `all_orders`, which is a superset of
 * what `available_order` returned, so a second call would only be asking a
 * question we have the answer to.
 */
export const buildDocs = (lines: AllOrder[]): OrderDoc[] => {
  const docs = new Map<string, OrderDoc>();

  for (const o of lines) {
    const key = docKey(o);
    const found = docs.get(key);
    if (found) {
      found.lineCount += 1;
      continue;
    }
    docs.set(key, {
      key,
      storeid: o.storeid,
      storenumber: o.storenumber,
      storename: o.storename,
      order_date: o.order_date,
      order_id: o.order_id,
      order_type: o.order_type,
      lineCount: 1,
    });
  }

  // Newest first, then by store, then by order number: the order somebody
  // looking for "the one I just sent up" reads in.
  return [...docs.values()].sort(
    (a, b) =>
      b.order_date.localeCompare(a.order_date) ||
      a.storenumber.localeCompare(b.storenumber) ||
      a.order_id - b.order_id,
  );
};

/**
 * The line's own derived figures, recomputed on the line itself.
 *
 * Same two helpers the fetch derives them with, so an edited line and a line
 * that arrived agree. Kept on the row rather than worked out at paint time
 * because the grid, the totals and the payload all read these three, and a
 * `cogs` left over from the value that was there before the edit would be
 * wrong in all three places at once.
 */
export const recompute = (l: DraftLine): DraftLine => {
  const e_ret = getERet(l.qty, l.weight, l.active_retail_price, l.scalable);
  const cogs = getCogs(l.base_cost, l.qty, l.scalable, l.weight, l.casesize);
  return { ...l, e_ret, cogs, rev: e_ret - cogs };
};

/** Every line of one order, in line order, as a fresh draft. */
export const startDraft = (doc: OrderDoc, lines: AllOrder[]): OrderDraft => {
  const mine = lines
    .filter((o) => docKey(o) === doc.key)
    .sort((a, b) => a.line_number - b.line_number)
    .map((o) =>
      recompute({
        ...o,
        original: {
          qty: o.qty,
          weight: o.weight,
          base_cost: o.base_cost,
          active_retail_price: o.active_retail_price,
        },
      }),
    );

  return { doc, lines: mine, resetNonce: 0 };
};

/**
 * The sequence number a new line would take: one past the last one on the
 * order, worked out from the lines that are actually there.
 *
 * Counted rather than counted-up. A stored counter left gaps — add a line,
 * drop it, add another, and the order went 18, 21 with nothing between them,
 * which reads like two lines went missing.
 */
export const nextSeq = (draft: OrderDraft) =>
  draft.lines.reduce((max, l) => Math.max(max, l.line_number), 0) + 1;

const mapLine = (
  draft: OrderDraft,
  lineNumber: number,
  fn: (l: DraftLine) => DraftLine,
): OrderDraft => ({
  ...draft,
  lines: draft.lines.map((l) => (l.line_number === lineNumber ? fn(l) : l)),
});

/** One typed field, with the derived figures brought along. */
export const applyField = (
  draft: OrderDraft,
  lineNumber: number,
  field: EditableField,
  value: number,
): OrderDraft =>
  mapLine(draft, lineNumber, (l) =>
    recompute({ ...l, [field]: field === "qty" ? Math.round(value) : value }),
  );

export const revertLine = (draft: OrderDraft, lineNumber: number): OrderDraft => ({
  ...mapLine(draft, lineNumber, (l) =>
    l.original === null ? l : recompute({ ...l, ...l.original }),
  ),
  resetNonce: draft.resetNonce + 1,
});

/** Edits undone and added lines dropped — the draft as it was loaded. */
export const revertAll = (draft: OrderDraft): OrderDraft => ({
  ...draft,
  lines: draft.lines
    .filter((l) => !isAdded(l))
    .map((l) => (l.original === null ? l : recompute({ ...l, ...l.original }))),
  resetNonce: draft.resetNonce + 1,
});

/**
 * A line the order did not have.
 *
 * The identity fields are copied off the order rather than typed, because
 * every one of them is `NOT NULL` and none of them is a decision: a line
 * added to order 48213 is on order 48213. `line_number` is the order's
 * highest plus one, which is what keeps the uniqueness rule true without
 * asking anybody.
 *
 * It arrives unresolved. The item lookup fills in the description and what
 * the store last paid; the vendor and case size are asked for, because
 * `items/itemlookup` does not return either and inventing a `vendor_id` would
 * put a line on the file against a vendor who does not stock it.
 */
/**
 * An empty line to fill in, which is not on the order yet.
 *
 * It is held beside the draft rather than in it until somebody says it is
 * finished: a half-filled row sitting among the real lines is in the order as
 * far as anything reading the grid can tell, and it had already taken a
 * sequence number it might not keep.
 *
 * Its number is 0 until it is added, because the number is decided then.
 */
export const blankLine = (draft: OrderDraft): DraftLine | null => {
  // Every NOT NULL field on a new line is copied off an existing one, so
  // there has to be one.
  const sibling = draft.lines.find((l) => !isAdded(l)) ?? draft.lines[0];
  if (!sibling) return null;

  return recompute({
    ...sibling,
    line_number: 0,
    product_code: "",
    description: "",
    // Left unset rather than inherited from the sibling: a different item is
    // not in the same sub department because it is on the same order, and
    // `items/itemlookup` does not return one. The column is nullable; the
    // import and the POS classify the line.
    sub_department: 0,
    sub_department_description: "",
    category: 0,
    category_description: "",
    vendor_id: "",
    vendor_name: "",
    qty: 1,
    casesize: 0,
    base_cost: 0,
    net_cost: 0,
    active_retail_price: 0,
    retail_price: null,
    active_price: 0,
    active_qty: 0,
    active_retail_qty: 0,
    extended_plessy: null,
    weight: 0,
    scalable: 0,
    tpr: 0,
    // `edited` marks an existing line that was changed, so a line that was
    // never on the order starts without it rather than inheriting the flag
    // from whichever line it was copied from.
    edited: null,
    original: null,
  });
};

/** The filled-in line, onto the end of the order. */
export const appendLine = (
  draft: OrderDraft,
  line: DraftLine,
): OrderDraft => ({
  ...draft,
  lines: [
    ...draft.lines,
    recompute({ ...line, line_number: nextSeq(draft), original: null }),
  ],
});

/**
 * What can be written onto an added line.
 *
 * Everything on it is typed or picked: the UPC, the description, the sub
 * department and the vendor. The item lookup fills the same fields when it
 * finds the code, which is why this is one shape rather than a lookup path
 * and a manual one that could drift apart.
 */
export type LinePatch = Partial<
  Pick<
    AllOrder,
    | "product_code"
    | "description"
    | "sub_department"
    | "sub_department_description"
    | "vendor_id"
    | "vendor_name"
    | "base_cost"
    | "net_cost"
    | "active_retail_price"
    | "casesize"
    | "scalable"
  >
>;

/**
 * Write fields onto a line.
 *
 * `bumpReset` is for a write the fields themselves did not make — the lookup
 * landing a cost into a box somebody is not typing in. A patch from the box
 * itself leaves the nonce alone, or every keystroke would remount the input
 * it came from.
 */
export const patchLine = (
  draft: OrderDraft,
  lineNumber: number,
  patch: LinePatch,
  bumpReset = false,
): OrderDraft => ({
  ...mapLine(draft, lineNumber, (l) => recompute({ ...l, ...patch })),
  resetNonce: draft.resetNonce + (bumpReset ? 1 : 0),
});

/** An added line can go, because it never existed. An existing one cannot. */
export const dropLine = (draft: OrderDraft, lineNumber: number): OrderDraft => ({
  ...draft,
  lines: draft.lines.filter(
    (l) => !(isAdded(l) && l.line_number === lineNumber),
  ),
});

export type Check = { id: string; label: string; ok: boolean };

/**
 * The four conditions the endpoint rejects on, plus the one this page adds.
 *
 * All five are checked here rather than left to the round trip: the endpoint
 * refuses the whole request, so a file that was going to be refused is better
 * caught before it is built.
 */
export const validate = (draft: OrderDraft): Check[] => {
  const seq = draft.lines.map((l) => `${l.order_id}|${l.line_number}`);
  const day = (iso: string) => iso.split("T")[0];

  return [
    {
      id: "store",
      label: "One store",
      ok: draft.lines.every((l) => l.storeid === draft.doc.storeid),
    },
    {
      id: "unique",
      label: "Seq numbers unique",
      ok: seq.every((v, i) => seq.indexOf(v) === i),
    },
    {
      id: "day",
      label: "One order date",
      ok: draft.lines.every(
        (l) => day(l.order_date) === day(draft.doc.order_date),
      ),
    },
    { id: "any", label: "At least one line", ok: draft.lines.length > 0 },
    {
      id: "items",
      label: "Added lines have an item and a vendor",
      ok: blankLines(draft).length === 0,
    },
  ];
};

export const canSubmit = (draft: OrderDraft) =>
  changedLines(draft).length > 0 && validate(draft).every((c) => c.ok);

/**
 * What goes up.
 *
 * Every line of the order, not only the changed ones.
 *
 * The import **upserts** (Dylan, 22 Oct 2026), so a partial file would be
 * safe — it would not delete the lines left out. Sending the whole order
 * anyway is a deliberate choice, not a leftover: a full file is idempotent
 * and says what the order IS, where a partial one is only correct for as long
 * as the upsert key stays `(order_id, line_number)`. The cost is resending
 * rows nobody touched, which is bytes. If that ever matters, this is the one
 * place that changes.
 *
 * The rows go back as they arrived with the edited fields overwritten, so the
 * columns `all_orders` returns and `AllOrder` does not declare —
 * `source_file_uri`, `source_file_etag`, `source_file_version_ts` — ride along
 * untouched. The model ignores extras, and hand-building line objects is what
 * loses a column.
 *
 * `edited` is set to 1 on an existing line whose values were changed, which is
 * what the column is for — it marks the ROW, not the order (Dylan, 22 Oct
 * 2026), which is what this already does. It is worked out here rather than written as
 * somebody types, so that putting a line back also puts its flag back — a
 * line that was edited and then reverted is not an edited line. A line that
 * arrived already flagged keeps the flag: clearing it is the import's
 * business, not ours, and we do not know what reads it next.
 */
export const buildPayload = (draft: OrderDraft) => ({
  storeid: draft.doc.storeid,
  lines: draft.lines.map(({ original: _original, ...line }) =>
    isEdited({ ...line, original: _original }) ? { ...line, edited: 1 } : line,
  ),
});

/**
 * The lines the grid draws, in sequence order.
 *
 * An added line ignores the search rather than being hidden by it — it is the
 * thing being worked on — and its number puts it at the end of the order,
 * which is where it was added.
 */
export const visibleLines = (
  draft: OrderDraft,
  opts: { code: string; desc: string; onlyChanged: boolean },
): DraftLine[] => {
  const code = opts.code.trim();
  const desc = opts.desc.trim().toLowerCase();

  return draft.lines
    .filter((l) => {
      if (isAdded(l)) return true;
      if (code && !String(l.product_code).includes(code)) return false;
      if (desc && !(l.description ?? "").toLowerCase().includes(desc)) return false;
      if (opts.onlyChanged && !isChanged(l)) return false;
      return true;
    })
    .sort((a, b) => a.line_number - b.line_number);
};

/** Ext cost for the whole order, as it arrived and as it stands. */
export const costSwing = (draft: OrderDraft) => {
  let before = 0;
  let after = 0;
  for (const l of draft.lines) {
    after += l.cogs ?? 0;
    if (l.original !== null) {
      before += getCogs(
        l.original.base_cost,
        l.original.qty,
        l.scalable,
        l.original.weight,
        l.casesize,
      );
    }
  }
  return { before, after, gap: after - before };
};

/* ------------------------------------------------------------------ */
/* Who may edit an order                                               */
/* ------------------------------------------------------------------ */

/**
 * The companies whose orders may be edited from here at all.
 *
 * A list rather than a flag on the company record because it is a rollout,
 * not a property of the business: these are the clients who have agreed to
 * edit orders in CounterCtrl. It moves when that list moves.
 *
 * It is the five Houchens companies — 1 Houchens, 4 Food Giant, 6 Sonic,
 * 17 Ace, 21 Brooks — plus **5, DCR, which is us**. DCR is a POS company with
 * no stores of its own, so it is here to let our own people work the feature
 * rather than because it has orders to edit. That is why this list and
 * `COMPANY_FAMILIES` in `pages/organization/dev/scoping` differ by exactly
 * one id: anyone reconciling the two should stop at that and not "fix" it.
 */
export const EDIT_COMPANY_IDS = [1, 4, 5, 6, 17, 21];

/** Levels run 1 basic, 2 user, 5 manager, 7 owner, 9 programmer. */
export const EDIT_MIN_LEVEL = 5;
/** Owner and up are not held to the cut-off; see `canEditOrders`. */
export const EDIT_ANY_DAY_FROM_LEVEL = 7;
export const PROGRAMMER_LEVEL = 9;

/**
 * Past the point in the week where an edit still reaches the vendor.
 *
 * Orders are submitted by Thursday, so from Thursday on this week's order has
 * already gone out and changing it in CounterCtrl changes a file that is no
 * longer the one the vendor is working from. Monday to Wednesday is the
 * window; Thursday through Sunday is closed.
 *
 * By the clock of whoever is looking, which is the only clock a button has —
 * a store in another timezone gets its own Thursday.
 */
export const isAfterOrderCutoff = (now: Date) => {
  const day = now.getDay(); // 0 Sun … 6 Sat
  return day === 0 || day >= 4;
};

/**
 * Whether the Edit button shows.
 *
 * - The person must hold one of the rollout companies. A programmer holds
 *   none of them by design — they set companies up rather than belong to one
 *   — so level 9 skips this and the cut-off both.
 * - Manager and up may edit, Monday to Wednesday. After that the order is
 *   with the vendor and the button goes.
 * - **Owner and up are not held to the cut-off.** They are the people who can
 *   ring the vendor about an order that has already gone; a manager cannot,
 *   so for a manager an edit after Thursday is a change to a file nobody
 *   reads.
 *
 * Visibility only. It hides a button and stops nobody who knows the route, so
 * the day matters to the data as much as to the screen — `orders/update_file`
 * takes a bare storeid and checks none of this, and should.
 */
export const canEditOrders = (
  userLevel: number,
  companyIds: number[],
  now: Date,
): boolean => {
  if (userLevel >= PROGRAMMER_LEVEL) return true;
  if (userLevel < EDIT_MIN_LEVEL) return false;
  if (!companyIds.some((id) => EDIT_COMPANY_IDS.includes(id))) return false;
  return userLevel >= EDIT_ANY_DAY_FROM_LEVEL || !isAfterOrderCutoff(now);
};
