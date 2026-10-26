import { describe, it, expect } from "vitest";
import {
  canEditOrders,
  addedLines,
  appendLine,
  applyField,
  applyUnitCost,
  stagePreview,
  stageUnitCost,
  changedLines,
  perCase,
  unitCostOf,
  blankLine,
  blankLines,
  buildDocs,
  buildPayload,
  canSubmit,
  costSwing,
  docKey,
  dropLine,
  editedLines,
  isAdded,
  isEdited,
  nextSeq,
  patchLine,
  recompute,
  revertAll,
  revertLine,
  startDraft,
  validate,
  visibleLines,
  type DraftLine,
  type LinePatch,
} from "./orderEdit";
import type { AllOrder } from "../../../interfaces";

/**
 * A line as `all_orders` sends it, plus the three columns the endpoint returns
 * and `AllOrder` does not declare — they are here to prove the payload keeps
 * them.
 */
const line = (over: Partial<AllOrder> = {}): AllOrder =>
  ({
    storeid: 1008,
    order_id: 48213,
    order_date: "2026-10-12T00:00:00",
    storenumber: "008",
    storename: "Hilltop",
    status: "open",
    record_count: 14,
    order_type: "SMS",
    product_code: "004900000634",
    qty: 10,
    line_number: 1,
    tpr: 0,
    active_price: 0,
    active_qty: 0,
    extended_plessy: null,
    net_cost: 24,
    weight: 0,
    active_retail_price: 5,
    active_retail_qty: 0,
    description: "COFFEE DARK ROAST",
    base_cost: 24,
    category: 1,
    category_description: "Grocery",
    vendor_id: "ACE-21",
    retail_price: null,
    sub_department: 10,
    sub_department_description: "Coffee",
    vendor_name: "Ace",
    casesize: 12,
    edited: null,
    scalable: 0,
    e_ret: 50,
    cogs: 20,
    rev: 30,
    source_file_uri: "s3://orders/in/48213.csv",
    source_file_etag: "abc123",
    source_file_version_ts: "2026-10-12T04:00:00",
    ...over,
  }) as AllOrder;

const ORDER = [
  line({ line_number: 1 }),
  line({ line_number: 2, product_code: "001200000110", description: "COLA 12PK" }),
  line({ line_number: 3, product_code: "007225003041", description: "WHITE BREAD" }),
];

/** A second order, same store, a week earlier. */
const OTHER = [
  line({ order_id: 47990, order_date: "2026-10-05T00:00:00", line_number: 1 }),
  line({ order_id: 47990, order_date: "2026-10-05T00:00:00", line_number: 2 }),
];

const ALL = [...ORDER, ...OTHER];
const docs = buildDocs(ALL);
const draftOf = () => startDraft(docs[0], ALL);

/**
 * The same storeid at two physical locations — the case `storeIdentity` exists
 * for, and the one that broke the "was" note: a merged draft holds two line 1s.
 */
const CO_LOCATED = [
  line({ storenumber: "369", storename: "Bruces Foodland 369", line_number: 1, qty: 12 }),
  line({ storenumber: "369", storename: "Bruces Foodland 369", line_number: 2, qty: 4 }),
  line({ storenumber: "370", storename: "Bruces Foodland 370", line_number: 1, qty: 13 }),
  line({ storenumber: "370", storename: "Bruces Foodland 370", line_number: 2, qty: 7 }),
];

describe("co-located stores", () => {
  it("keeps the two locations as separate orders", () => {
    expect(docKey(CO_LOCATED[0])).not.toBe(docKey(CO_LOCATED[2]));
    expect(buildDocs(CO_LOCATED)).toHaveLength(2);
  });

  it("gives each draft only its own location's lines", () => {
    const [first, second] = buildDocs(CO_LOCATED);
    const a = startDraft(first, CO_LOCATED);
    const b = startDraft(second, CO_LOCATED);

    expect(a.lines).toHaveLength(2);
    expect(b.lines).toHaveLength(2);
    expect(a.lines.map((l) => l.storenumber)).toEqual(["369", "369"]);
    expect(b.lines.map((l) => l.storenumber)).toEqual(["370", "370"]);
  });

  it("edits one location without touching the other, and keeps its own was", () => {
    const [first] = buildDocs(CO_LOCATED);
    const draft = startDraft(first, CO_LOCATED);
    // 369 line 1 is qty 12; 370 line 1 is qty 13. Editing by line number
    // alone used to hit both and report the wrong original.
    const next = applyField(draft, 1, "qty", 9);

    const edited = next.lines.find((l) => l.line_number === 1)!;
    expect(edited.qty).toBe(9);
    expect(edited.original?.qty).toBe(12);
    expect(next.lines.filter((l) => l.qty === 9)).toHaveLength(1);
  });
});

describe("buildDocs", () => {
  it("makes one document per store, order and date", () => {
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.order_id)).toEqual([48213, 47990]);
  });

  it("counts the lines each one holds", () => {
    expect(docs[0].lineCount).toBe(3);
    expect(docs[1].lineCount).toBe(2);
  });

  it("keys on the store as well as the order number", () => {
    const elsewhere = line({ storeid: 1014, storenumber: "014" });
    expect(docKey(elsewhere)).not.toBe(docKey(ORDER[0]));
    expect(buildDocs([...ORDER, elsewhere])).toHaveLength(2);
  });
});

describe("startDraft", () => {
  it("takes only that order's lines, in line order", () => {
    const d = draftOf();
    expect(d.lines.map((l) => l.line_number)).toEqual([1, 2, 3]);
    expect(d.lines.every((l) => l.order_id === 48213)).toBe(true);
  });

  it("records what the editable fields arrived as", () => {
    const d = draftOf();
    expect(d.lines[0].original).toEqual({
      qty: 10,
      weight: 0,
      base_cost: 24,
      active_retail_price: 5,
    });
    expect(isEdited(d.lines[0])).toBe(false);
    expect(isAdded(d.lines[0])).toBe(false);
  });

  it("puts the next line one past the highest", () => {
    expect(nextSeq(draftOf())).toBe(4);
  });
});

describe("applyField", () => {
  it("recomputes the derived figures on the line", () => {
    const d = applyField(draftOf(), 1, "qty", 20);
    const l = d.lines[0];
    // 24 a case over 12 is 2 a unit, so 20 cases cost 40 and ring 100.
    expect(l.cogs).toBe(40);
    expect(l.e_ret).toBe(100);
    expect(l.rev).toBe(60);
  });

  it("marks the line edited without touching its neighbours", () => {
    const d = applyField(draftOf(), 2, "base_cost", 30);
    expect(editedLines(d).map((l) => l.line_number)).toEqual([2]);
  });

  it("rounds a quantity, because a line is a whole number of cases", () => {
    const d = applyField(draftOf(), 1, "qty", 12.6);
    expect(d.lines[0].qty).toBe(13);
  });

  it("is not edited once the value is typed back", () => {
    const there = applyField(draftOf(), 1, "qty", 20);
    const back = applyField(there, 1, "qty", 10);
    expect(isEdited(back.lines[0])).toBe(false);
    expect(back.lines[0].cogs).toBe(20);
  });
});

describe("revert", () => {
  it("puts one line back", () => {
    const d = revertLine(applyField(draftOf(), 1, "qty", 99), 1);
    expect(d.lines[0].qty).toBe(10);
    expect(d.lines[0].cogs).toBe(20);
    expect(editedLines(d)).toHaveLength(0);
  });

  it("undoes every edit and drops what was added", () => {
    const edited = applyField(draftOf(), 1, "qty", 99);
    const withNew = appendLine(
      edited,
      recompute({ ...blankLine(edited)!, product_code: "1", vendor_id: "V" }),
    );
    const d = revertAll(withNew);
    expect(d.lines).toHaveLength(3);
    expect(editedLines(d)).toHaveLength(0);
    expect(addedLines(d)).toHaveLength(0);
  });
});

/** The line being composed, filled in the way the panel fills it. */
const fill = (line: DraftLine, patch: LinePatch): DraftLine =>
  recompute({ ...line, ...patch });

const ITEM: LinePatch = {
  product_code: "002800000913",
  description: "ORANGE JUICE 52OZ",
  base_cost: 27.92,
  active_retail_price: 4.99,
  casesize: 8,
  vendor_id: "DRY-11",
  vendor_name: "Dairy Co",
};

describe("a line being added", () => {
  it("copies the order's identity and carries no number yet", () => {
    const fresh = blankLine(draftOf())!;
    expect(fresh.order_id).toBe(48213);
    expect(fresh.storeid).toBe(1008);
    expect(fresh.order_date).toBe("2026-10-12T00:00:00");
    expect(fresh.order_type).toBe("SMS");
    expect(fresh.line_number).toBe(0);
    expect(isAdded(fresh)).toBe(true);
  });

  it("does not take its sub department from the line beside it", () => {
    expect(blankLine(draftOf())!.sub_department).toBe(0);
  });

  it("is not on the order until it is added", () => {
    const d = draftOf();
    blankLine(d);
    expect(d.lines).toHaveLength(3);
    expect(addedLines(d)).toHaveLength(0);
    expect(canSubmit(d)).toBe(false);
  });

  it("lands on the end of the order, one past the last line", () => {
    const d = appendLine(draftOf(), fill(blankLine(draftOf())!, ITEM));
    expect(d.lines).toHaveLength(4);
    expect(d.lines[3].line_number).toBe(4);
    expect(canSubmit(d)).toBe(true);
  });

  it("is always one past the last, however many were discarded", () => {
    // Open one, throw it away, open another: the second is still line 4.
    const d = draftOf();
    blankLine(d);
    blankLine(d);
    expect(nextSeq(d)).toBe(4);

    const added = appendLine(d, fill(blankLine(d)!, ITEM));
    expect(nextSeq(added)).toBe(5);

    const gone = dropLine(added, 4);
    expect(nextSeq(gone)).toBe(4);
  });

  it("costs what the item and the quantity say", () => {
    const d = appendLine(draftOf(), fill(blankLine(draftOf())!, ITEM));
    const fresh = d.lines[3];
    // 27.92 a case of 8 is 3.49 a unit, one unit on the line.
    expect(fresh.cogs).toBeCloseTo(3.49, 2);
    expect(fresh.e_ret).toBeCloseTo(4.99, 2);
  });

  it("is not a line with an item and no vendor", () => {
    const half = fill(blankLine(draftOf())!, {
      product_code: "002800000913",
      description: "ORANGE JUICE 52OZ",
    });
    const d = appendLine(draftOf(), half);
    expect(blankLines(d)).toHaveLength(1);
    expect(validate(d).find((c) => c.id === "items")!.ok).toBe(false);
    expect(canSubmit(d)).toBe(false);
  });

  it("is not a line with a vendor and no item", () => {
    const half = fill(blankLine(draftOf())!, { vendor_id: "DRY-11" });
    const d = appendLine(draftOf(), half);
    expect(blankLines(d)).toHaveLength(1);
    expect(canSubmit(d)).toBe(false);
  });

  it("can be dropped, because it never existed", () => {
    const d = appendLine(draftOf(), fill(blankLine(draftOf())!, ITEM));
    expect(dropLine(d, 4).lines).toHaveLength(3);
  });

  it("will not drop a line the order really has", () => {
    expect(dropLine(draftOf(), 1).lines).toHaveLength(3);
  });

  it("has nothing to copy from on an order with no lines", () => {
    expect(blankLine({ ...draftOf(), lines: [] })).toBeNull();
  });
});

describe("resetNonce", () => {
  it("does not move when a field is typed", () => {
    const d = applyField(draftOf(), 1, "qty", 20);
    expect(d.resetNonce).toBe(0);
  });

  it("moves on a revert, so the field is told to re-read", () => {
    const edited = applyField(draftOf(), 1, "qty", 20);
    expect(revertLine(edited, 1).resetNonce).toBe(1);
    expect(revertAll(edited).resetNonce).toBe(1);
  });

  it("moves when the lookup writes a cost into a line", () => {
    const d = patchLine(draftOf(), 1, { base_cost: 10 }, true);
    expect(d.resetNonce).toBe(1);
  });

  it("stays put for a patch the field itself made", () => {
    const d = patchLine(draftOf(), 1, { description: "typed" });
    expect(d.resetNonce).toBe(0);
  });
});

describe("validate", () => {
  it("passes a draft as it was loaded", () => {
    expect(validate(draftOf()).every((c) => c.ok)).toBe(true);
  });

  it("will not submit a draft nothing changed in", () => {
    expect(canSubmit(draftOf())).toBe(false);
  });

  it("catches a repeated line number", () => {
    const d = draftOf();
    const doctored = { ...d, lines: [...d.lines, d.lines[0]] };
    expect(validate(doctored).find((c) => c.id === "unique")!.ok).toBe(false);
  });

  it("catches a line from another store", () => {
    const d = draftOf();
    const doctored = {
      ...d,
      lines: [...d.lines, { ...d.lines[0], storeid: 1014, line_number: 9 }],
    };
    expect(validate(doctored).find((c) => c.id === "store")!.ok).toBe(false);
  });

  it("catches a second day", () => {
    const d = draftOf();
    const doctored = {
      ...d,
      lines: [
        ...d.lines,
        { ...d.lines[0], order_date: "2026-10-13T00:00:00", line_number: 9 },
      ],
    };
    expect(validate(doctored).find((c) => c.id === "day")!.ok).toBe(false);
  });

  it("catches an empty order", () => {
    const d = { ...draftOf(), lines: [] };
    expect(validate(d).find((c) => c.id === "any")!.ok).toBe(false);
  });
});

describe("buildPayload", () => {
  it("sends every line, not only the changed ones", () => {
    const d = applyField(draftOf(), 1, "qty", 20);
    const payload = buildPayload(d);
    expect(payload.storeid).toBe(1008);
    expect(payload.lines).toHaveLength(3);
  });

  it("keeps the columns AllOrder does not declare", () => {
    const payload = buildPayload(applyField(draftOf(), 1, "qty", 20));
    const first = payload.lines[0] as Record<string, unknown>;
    expect(first.source_file_uri).toBe("s3://orders/in/48213.csv");
    expect(first.source_file_etag).toBe("abc123");
    expect(first.source_file_version_ts).toBe("2026-10-12T04:00:00");
  });

  it("leaves this page's own bookkeeping out of it", () => {
    const payload = buildPayload(draftOf());
    const first = payload.lines[0] as Record<string, unknown>;
    expect("original" in first).toBe(false);
    expect("resolved" in first).toBe(false);
  });

  it("carries the edited value, and the figures derived from it", () => {
    const payload = buildPayload(applyField(draftOf(), 1, "qty", 20));
    expect(payload.lines[0].qty).toBe(20);
    expect(payload.lines[0].cogs).toBe(40);
  });

  it("flags the line that was edited, and only that one", () => {
    const payload = buildPayload(applyField(draftOf(), 1, "qty", 20));
    expect(payload.lines[0].edited).toBe(1);
    expect(payload.lines[1].edited).toBeNull();
    expect(payload.lines[2].edited).toBeNull();
  });

  it("takes the flag back off a line that was put back", () => {
    const there = applyField(draftOf(), 1, "qty", 20);
    const back = revertLine(there, 1);
    expect(buildPayload(back).lines[0].edited).toBeNull();
  });

  it("leaves a flag that arrived on the line alone", () => {
    const already = startDraft(docs[0], [
      line({ line_number: 1, edited: 1 }),
      line({ line_number: 2 }),
    ]);
    const payload = buildPayload(applyField(already, 2, "qty", 20));
    expect(payload.lines[0].edited).toBe(1);
    expect(payload.lines[1].edited).toBe(1);
  });

  it("does not flag an added line, which was never edited", () => {
    const d = appendLine(draftOf(), fill(blankLine(draftOf())!, ITEM));
    expect(buildPayload(d).lines[3].edited).toBeNull();
  });
});

describe("visibleLines", () => {
  const opts = { code: "", desc: "", onlyChanged: false };

  it("searches the description", () => {
    const out = visibleLines(draftOf(), { ...opts, desc: "cola" });
    expect(out.map((l) => l.line_number)).toEqual([2]);
  });

  it("searches the product code by part of it", () => {
    const out = visibleLines(draftOf(), { ...opts, code: "0072" });
    expect(out.map((l) => l.line_number)).toEqual([3]);
  });

  it("can show only what changed", () => {
    const d = applyField(draftOf(), 3, "qty", 5);
    const out = visibleLines(d, { ...opts, onlyChanged: true });
    expect(out.map((l) => l.line_number)).toEqual([3]);
  });

  it("shows an added line whatever the search says, in sequence", () => {
    const d = appendLine(
      draftOf(),
      recompute({ ...blankLine(draftOf())!, ...ITEM }),
    );
    const out = visibleLines(d, { ...opts, desc: "cola" });
    expect(out.map((l) => l.line_number)).toEqual([2, 4]);
  });
});

describe("costSwing", () => {
  it("reports the order's ext cost before and after", () => {
    const d = applyField(draftOf(), 1, "qty", 20);
    const { before, after, gap } = costSwing(d);
    expect(before).toBe(60);
    expect(after).toBe(80);
    expect(gap).toBe(20);
  });

  it("counts an added line in the after only", () => {
    const d = appendLine(
      draftOf(),
      recompute({
        ...blankLine(draftOf())!,
        base_cost: 24,
        casesize: 12,
        active_retail_price: 5,
        vendor_id: "ACE-21",
        product_code: "002800000913",
      }),
    );
    const { before, after } = costSwing(d);
    expect(before).toBe(60);
    expect(after).toBe(62);
  });

  it("costs an edited weight against the weight that arrived", () => {
    // A scale item: the money follows the weight, not the quantity.
    const scale = startDraft(docs[0], [
      line({ scalable: 1, weight: 10, base_cost: 24, casesize: 12 }),
    ]);
    const heavier = applyField(scale, 1, "weight", 20);
    const { before, after, gap } = costSwing(heavier);
    expect(before).toBe(20);
    expect(after).toBe(40);
    expect(gap).toBe(20);
  });
});

describe("canEditOrders", () => {
  // Monday the 19th through Sunday the 25th of October 2026, so every branch
  // of the cut-off is a real date rather than a mocked getDay.
  const MON = new Date("2026-10-19T10:00:00");
  const WED = new Date("2026-10-21T10:00:00");
  const THURS = new Date("2026-10-22T10:00:00");
  const FRI = new Date("2026-10-23T10:00:00");
  const SAT = new Date("2026-10-24T10:00:00");
  const SUN = new Date("2026-10-25T10:00:00");
  const OPEN = [MON, WED];
  const CLOSED = [THURS, FRI, SAT, SUN];
  const HELD = [4];
  const OTHER = [2, 99];

  it("is the week it says it is", () => {
    expect([MON, WED, THURS, FRI, SAT, SUN].map((d) => d.getDay())).toEqual([
      1, 3, 4, 5, 6, 0,
    ]);
  });

  it("lets a manager edit up to the cut-off", () => {
    OPEN.forEach((d) => expect(canEditOrders(5, HELD, d)).toBe(true));
  });

  it("closes on a manager from Thursday through Sunday", () => {
    // Orders go out by Thursday. After that the vendor is working from a file
    // this no longer changes, and a manager cannot ring them about it.
    CLOSED.forEach((d) => expect(canEditOrders(5, HELD, d)).toBe(false));
    CLOSED.forEach((d) => expect(canEditOrders(6, HELD, d)).toBe(false));
  });

  it("does not hold an owner to the cut-off", () => {
    // Owners can ring the vendor about an order that has already gone, so the
    // day stops mattering to them. This is the half that was backwards: it
    // used to let owners in ONLY on Thursday.
    [...OPEN, ...CLOSED].forEach((d) => {
      expect(canEditOrders(7, HELD, d)).toBe(true);
      expect(canEditOrders(8, HELD, d)).toBe(true);
    });
  });

  it("lets a programmer in on any day, holding no company at all", () => {
    [...OPEN, ...CLOSED].forEach((d) =>
      expect(canEditOrders(9, [], d)).toBe(true),
    );
  });

  it("refuses a company that is not in the rollout, at any level or day", () => {
    expect(canEditOrders(5, OTHER, MON)).toBe(false);
    expect(canEditOrders(7, OTHER, MON)).toBe(false);
    expect(canEditOrders(8, OTHER, THURS)).toBe(false);
  });

  it("takes one held company out of several", () => {
    expect(canEditOrders(5, [99, 21, 2], MON)).toBe(true);
  });

  it("keeps DCR in the rollout, because that is us", () => {
    // DCR (5) is a POS company with no stores. It is in EDIT_COMPANY_IDS so
    // our own people can work the feature, which is why that list and the
    // Houchens family differ by exactly this id.
    expect(canEditOrders(5, [5], MON)).toBe(true);
  });

  it("refuses below manager, company or no company", () => {
    expect(canEditOrders(2, HELD, MON)).toBe(false);
    expect(canEditOrders(1, HELD, MON)).toBe(false);
  });

  it("refuses somebody holding nothing", () => {
    expect(canEditOrders(5, [], MON)).toBe(false);
  });
});

describe("unit cost", () => {
  it("reads as case cost over case size", () => {
    // base_cost 24 on a case of 12
    expect(unitCostOf(ORDER[0])).toBe(2);
  });

  it("writes the case cost it implies, and recomputes ext cost", () => {
    const next = applyUnitCost(draftOf(), 1, 2.5);
    const l = next.lines.find((x) => x.line_number === 1)!;
    expect(l.base_cost).toBe(30); // 2.50 × 12
    // qty 10 on a case of 12: 30 / 12 × 10
    expect(l.cogs).toBeCloseTo(25, 6);
  });

  it("keeps the case cost it started from as the original", () => {
    const next = applyUnitCost(draftOf(), 1, 2.5);
    const l = next.lines.find((x) => x.line_number === 1)!;
    expect(l.original?.base_cost).toBe(24);
  });

  it("treats no case size as a case of one", () => {
    const uncased = line({ casesize: 0, base_cost: 3 });
    expect(perCase(uncased)).toBe(1);
    expect(unitCostOf(uncased)).toBe(3);

    const [doc] = buildDocs([uncased]);
    const next = applyUnitCost(startDraft(doc, [uncased]), 1, 4);
    expect(next.lines[0].base_cost).toBe(4);
    expect(Number.isFinite(next.lines[0].cogs)).toBe(true);
  });

  it("touches only its own location when a storeid is shared", () => {
    const [first] = buildDocs(CO_LOCATED);
    const next = applyUnitCost(startDraft(first, CO_LOCATED), 1, 5);
    expect(next.lines.filter((l) => l.base_cost === 60)).toHaveLength(1);
    expect(next.lines.every((l) => l.storenumber === "369")).toBe(true);
  });
});

describe("staged unit cost", () => {
  /** One item, three stores, two case sizes — the case that forced unit cost. */
  const PIZZA = "004470036114";
  const SPREAD = [
    line({ storeid: 10, storenumber: "010", order_id: 1, line_number: 1, product_code: PIZZA, casesize: 12, base_cost: 0, qty: 18 }),
    line({ storeid: 10, storenumber: "010", order_id: 1, line_number: 2, product_code: "OTHER", casesize: 6, base_cost: 9 }),
    line({ storeid: 114, storenumber: "114", order_id: 2, line_number: 1, product_code: PIZZA, casesize: 24, base_cost: 0, qty: 6 }),
    line({ storeid: 206, storenumber: "206", order_id: 3, line_number: 4, product_code: PIZZA, casesize: 12, base_cost: 0, qty: 9 }),
  ];
  const pizza = SPREAD.filter((l) => l.product_code === PIZZA);

  it("previews one row per order", () => {
    expect(stagePreview(pizza, SPREAD, 2)).toHaveLength(3);
  });

  it("gives each store the case cost its own case size implies", () => {
    const byStore = Object.fromEntries(
      stagePreview(pizza, SPREAD, 2).map((p) => [p.doc.storenumber, p.newCaseCost]),
    );
    expect(byStore).toEqual({ "010": 24, "114": 48, "206": 24 });
  });

  it("stages a draft per order, changing only the item's lines", () => {
    const drafts = stageUnitCost({}, pizza, SPREAD, 2);
    const all = Object.values(drafts);
    expect(all).toHaveLength(3);

    const store10 = all.find((d) => d.doc.storenumber === "010")!;
    expect(store10.lines).toHaveLength(2); // the whole order, other line included
    expect(changedLines(store10).map((l) => l.product_code)).toEqual([PIZZA]);
    expect(store10.lines.find((l) => l.product_code === "OTHER")!.base_cost).toBe(9);
  });

  it("keeps each line's own original for the was note", () => {
    const drafts = stageUnitCost({}, pizza, SPREAD, 2);
    const l = Object.values(drafts)
      .find((d) => d.doc.storenumber === "114")!
      .lines.find((x) => x.line_number === 1)!;
    expect(l.base_cost).toBe(48);
    expect(l.original?.base_cost).toBe(0);
  });

  it("stages on top of edits already made, rather than starting over", () => {
    const [doc] = buildDocs(SPREAD).filter((d) => d.storenumber === "010");
    // someone had already changed qty on the other line of this order
    const edited = applyField(startDraft(doc, SPREAD), 2, "qty", 7);
    const drafts = stageUnitCost({ [doc.key]: edited }, pizza, SPREAD, 2);

    const after = drafts[doc.key];
    expect(after.lines.find((l) => l.line_number === 2)!.qty).toBe(7);
    expect(after.lines.find((l) => l.line_number === 1)!.base_cost).toBe(24);
    expect(changedLines(after)).toHaveLength(2);
  });

  it("leaves orders that do not carry the item alone", () => {
    const drafts = stageUnitCost({}, pizza, [...SPREAD, line({ storeid: 999, storenumber: "999", order_id: 9 })], 2);
    expect(Object.values(drafts).some((d) => d.doc.storenumber === "999")).toBe(false);
  });

  it("keeps two locations of one storeid as two drafts", () => {
    const shared = CO_LOCATED.map((l) => ({ ...l, product_code: PIZZA }));
    const drafts = Object.values(stageUnitCost({}, shared, shared, 2));
    expect(drafts).toHaveLength(2);
    for (const d of drafts) {
      expect(new Set(d.lines.map((l) => l.storenumber)).size).toBe(1);
    }
  });
});
