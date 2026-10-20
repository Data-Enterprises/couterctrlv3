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

/** The three fields an edit may touch. Everything else rides along. */
export const EDITABLE = ["qty", "base_cost", "active_retail_price"] as const;
export type EditableField = (typeof EDITABLE)[number];

export const FIELD_LABEL: Record<EditableField, string> = {
  qty: "Qty",
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
  /** An added line is not a line until a UPC resolves against the store. */
  resolved: boolean;
};

export type OrderDraft = {
  doc: OrderDoc;
  lines: DraftLine[];
  /** Assigned, never reused: a dropped line does not hand its number back. */
  nextLineNumber: number;
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
 * The vendor counts as much as the item: `vendor_id` is `NOT NULL` on the
 * order, and `resolved` only says the item lookup answered. Checking the
 * fields rather than the flag means a line cannot reach the file with an
 * empty vendor on it.
 */
export const blankLines = (d: OrderDraft) =>
  d.lines.filter(
    (l) => isAdded(l) && (!l.resolved || !l.product_code || !l.vendor_id),
  );

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
          base_cost: o.base_cost,
          active_retail_price: o.active_retail_price,
        },
        resolved: true,
      }),
    );

  return {
    doc,
    lines: mine,
    nextLineNumber:
      mine.reduce((max, l) => Math.max(max, l.line_number), 0) + 1,
    resetNonce: 0,
  };
};

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
export const addLine = (
  draft: OrderDraft,
): { draft: OrderDraft; lineNumber: number | null } => {
  // Every NOT NULL field on a new line is copied off an existing one, so
  // there has to be one. A draft always has lines — it was built from them —
  // but a reverted-to-empty draft would otherwise produce a line with no
  // order number on it.
  const sibling = draft.lines.find((l) => !isAdded(l)) ?? draft.lines[0];
  if (!sibling) return { draft, lineNumber: null };

  const lineNumber = draft.nextLineNumber;

  const fresh: DraftLine = recompute({
    ...sibling,
    line_number: lineNumber,
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
    // Not ours to set: it is already on every row and what reads it is on the
    // import side, not here.
    edited: sibling.edited,
    original: null,
    resolved: false,
  });

  return {
    draft: {
      ...draft,
      lines: [...draft.lines, fresh],
      nextLineNumber: lineNumber + 1,
    },
    lineNumber,
  };
};

/** What the item lookup and the two asked-for fields put on an added line. */
export type ResolvedItem = {
  product_code: string;
  description: string;
  base_cost: number;
  active_retail_price: number;
  casesize: number;
  vendor_id: string;
  vendor_name: string;
  scalable: number;
};

export const resolveLine = (
  draft: OrderDraft,
  lineNumber: number,
  item: Partial<ResolvedItem>,
  resolved: boolean,
): OrderDraft => ({
  ...mapLine(draft, lineNumber, (l) => recompute({ ...l, ...item, resolved })),
  // The lookup writes the cost and the retail, so the fields showing them
  // have to be told.
  resetNonce: draft.resetNonce + 1,
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
 * Every line of the order, not only the changed ones. Whether the import
 * replaces the order or upserts by `(order_id, line_number)` is not in this
 * repo, and a full-file replace fed a partial file would delete the lines
 * left out — far worse than resending rows nobody touched. If it turns out to
 * upsert, this is the one place that changes.
 *
 * The rows go back as they arrived with the edited fields overwritten, so the
 * columns `all_orders` returns and `AllOrder` does not declare —
 * `source_file_uri`, `source_file_etag`, `source_file_version_ts` — ride along
 * untouched. The model ignores extras, and hand-building line objects is what
 * loses a column.
 */
export const buildPayload = (draft: OrderDraft) => ({
  storeid: draft.doc.storeid,
  lines: draft.lines.map(({ original: _original, resolved: _resolved, ...line }) => line),
});

/**
 * The lines the grid draws.
 *
 * Added lines sit at the top and ignore the search: a half-filled line that a
 * search had hidden would hold the save back with nothing on screen to
 * explain it.
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
    .sort(
      (a, b) =>
        Number(isAdded(b)) - Number(isAdded(a)) || a.line_number - b.line_number,
    );
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
        l.weight,
        l.casesize,
      );
    }
  }
  return { before, after, gap: after - before };
};
