import { describe, it, expect } from "vitest";
import {
  addLine,
  addedLines,
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
  applyField,
  resolveLine,
  revertAll,
  revertLine,
  startDraft,
  validate,
  visibleLines,
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
      base_cost: 24,
      active_retail_price: 5,
    });
    expect(isEdited(d.lines[0])).toBe(false);
    expect(isAdded(d.lines[0])).toBe(false);
  });

  it("starts the next line number past the highest", () => {
    expect(draftOf().nextLineNumber).toBe(4);
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
    const { draft: withNew } = addLine(edited);
    const d = revertAll(withNew);
    expect(d.lines).toHaveLength(3);
    expect(editedLines(d)).toHaveLength(0);
    expect(addedLines(d)).toHaveLength(0);
  });
});

describe("added lines", () => {
  it("takes the next line number and the order's identity", () => {
    const { draft, lineNumber } = addLine(draftOf());
    const fresh = draft.lines.find((l) => l.line_number === lineNumber)!;
    expect(lineNumber).toBe(4);
    expect(fresh.order_id).toBe(48213);
    expect(fresh.storeid).toBe(1008);
    expect(fresh.order_date).toBe("2026-10-12T00:00:00");
    expect(fresh.order_type).toBe("SMS");
    expect(isAdded(fresh)).toBe(true);
  });

  it("carries no item, and holds the save back until it does", () => {
    const { draft } = addLine(draftOf());
    expect(blankLines(draft)).toHaveLength(1);
    expect(validate(draft).find((c) => c.id === "items")!.ok).toBe(false);
    expect(canSubmit(draft)).toBe(false);
  });

  it("is a line once the item and the vendor are on it", () => {
    const { draft, lineNumber } = addLine(draftOf());
    const d = resolveLine(
      draft,
      lineNumber!,
      {
        product_code: "002800000913",
        description: "ORANGE JUICE 52OZ",
        base_cost: 27.92,
        active_retail_price: 4.99,
        casesize: 8,
        vendor_id: "DRY-11",
        vendor_name: "Dairy Co",
      },
      true,
    );
    const fresh = d.lines.find((l) => l.line_number === lineNumber)!;
    expect(fresh.resolved).toBe(true);
    expect(blankLines(d)).toHaveLength(0);
    expect(canSubmit(d)).toBe(true);
    // 27.92 a case of 8 is 3.49 a unit, one case ordered.
    expect(fresh.cogs).toBeCloseTo(3.49, 2);
    expect(fresh.e_ret).toBeCloseTo(4.99, 2);
  });

  it("is still not a line with the item but no vendor", () => {
    const { draft, lineNumber } = addLine(draftOf());
    const d = resolveLine(
      draft,
      lineNumber!,
      { product_code: "002800000913", description: "ORANGE JUICE 52OZ" },
      true,
    );
    expect(blankLines(d)).toHaveLength(1);
    expect(validate(d).find((c) => c.id === "items")!.ok).toBe(false);
    expect(canSubmit(d)).toBe(false);
  });

  it("will not add a line to a draft with nothing to copy from", () => {
    const empty = { ...draftOf(), lines: [] };
    const { draft, lineNumber } = addLine(empty);
    expect(lineNumber).toBeNull();
    expect(draft.lines).toHaveLength(0);
  });

  it("never hands a dropped line's number back", () => {
    const first = addLine(draftOf());
    const gone = dropLine(first.draft, first.lineNumber!);
    expect(gone.lines).toHaveLength(3);
    expect(addLine(gone).lineNumber).toBe(5);
  });

  it("will not drop a line the order really has", () => {
    const d = dropLine(draftOf(), 1);
    expect(d.lines).toHaveLength(3);
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
    const { draft, lineNumber } = addLine(draftOf());
    const d = resolveLine(draft, lineNumber!, { base_cost: 10 }, true);
    expect(d.resetNonce).toBe(1);
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

  it("does not touch the edited column", () => {
    const payload = buildPayload(applyField(draftOf(), 1, "qty", 20));
    expect(payload.lines[0].edited).toBeNull();
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

  it("shows an added line whatever the search says", () => {
    const { draft } = addLine(draftOf());
    const out = visibleLines(draft, { ...opts, desc: "cola" });
    expect(out.map((l) => l.line_number)).toEqual([4, 2]);
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
    const { draft, lineNumber } = addLine(draftOf());
    const d = resolveLine(
      draft,
      lineNumber!,
      {
        base_cost: 24,
        casesize: 12,
        active_retail_price: 5,
        vendor_id: "ACE-21",
      },
      true,
    );
    const { before, after } = costSwing(d);
    expect(before).toBe(60);
    expect(after).toBe(62);
  });
});
