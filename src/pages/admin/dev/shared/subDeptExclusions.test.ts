import { describe, it, expect } from "vitest";
import {
  bestLabel,
  companyDeptRows,
  coverageText,
  deptState,
  differingNumbers,
  looksLikeHash,
  normalizeDesc,
  planStoreToggle,
  planToggle,
  type ExclStore,
  type ExclusionRow,
  type StoreSubDept,
} from "./subDeptExclusions";

const stores: ExclStore[] = [
  { storeid: 501, store_number: "018", store_name: "Owensboro" },
  { storeid: 502, store_number: "020", store_name: "Henderson" },
  { storeid: 503, store_number: "021", store_name: "Madisonville" },
];

/** The case this whole module exists for: one department, three stores, three
 *  different numbers, three different spellings. */
const lotteryEverywhere: StoreSubDept[] = [
  {
    storeid: 501,
    sub_department: 14,
    description: "LOTTERY",
    lastRung: "2026-10-14",
  },
  {
    storeid: 502,
    sub_department: 61,
    description: "Lottery",
    lastRung: "2026-10-13",
  },
  {
    storeid: 503,
    sub_department: 61,
    description: "lottery",
    lastRung: "2026-10-15",
  },
];

describe("normalizeDesc", () => {
  it("joins the spellings stores actually differ by", () => {
    expect(normalizeDesc("LOTTERY")).toBe(normalizeDesc("Lottery"));
    expect(normalizeDesc("MONEY  ORDERS ")).toBe("money orders");
  });

  it("does not fuse a fee department into the sale it belongs to", () => {
    expect(normalizeDesc("MONEY ORDER FEE")).not.toBe(
      normalizeDesc("MONEY ORDERS"),
    );
  });
});

describe("looksLikeHash", () => {
  it("flags the pass-throughs", () => {
    expect(looksLikeHash("LOTTERY")).toBe(true);
    expect(looksLikeHash("Money Orders")).toBe(true);
    expect(looksLikeHash("POSTAGE STAMPS")).toBe(true);
  });

  it("leaves real departments alone", () => {
    expect(looksLikeHash("GROCERY")).toBe(false);
    expect(looksLikeHash("BEEF")).toBe(false);
  });
});

describe("bestLabel", () => {
  it("takes the most common spelling", () => {
    expect(bestLabel(["Lottery", "LOTTERY", "Lottery"])).toBe("Lottery");
  });

  it("breaks a tie the same way every time", () => {
    expect(bestLabel(["LOTTERY", "Lottery"])).toBe(
      bestLabel(["Lottery", "LOTTERY"]),
    );
  });
});

describe("companyDeptRows", () => {
  it("gathers one department across stores that number it differently", () => {
    const rows = companyDeptRows(stores, lotteryEverywhere, []);
    expect(rows).toHaveLength(1);
    expect(rows[0].at.map((a) => [a.store_number, a.sub_department])).toEqual([
      ["018", 14],
      ["020", 61],
      ["021", 61],
    ]);
  });

  it("carries the latest day any store rang it", () => {
    expect(companyDeptRows(stores, lotteryEverywhere, [])[0].lastRung).toBe(
      "2026-10-15",
    );
  });

  it("names the stores that never rang it rather than counting them as refusals", () => {
    const rows = companyDeptRows(stores, [lotteryEverywhere[0]], []);
    expect(rows[0].at).toHaveLength(1);
    expect(rows[0].absent.map((s) => s.store_number)).toEqual(["020", "021"]);
  });

  it("matches an exclusion on storeid AND number, never the number alone", () => {
    // 61 is excluded at 020. The same number at 021 must stay untouched, and
    // 018's Lottery is 14, so it is not excluded either.
    const excl: ExclusionRow[] = [
      { storeid: 502, sub_department: 61, sub_department_description: "Lottery" },
    ];
    const row = companyDeptRows(stores, lotteryEverywhere, excl)[0];
    expect(row.at.map((a) => a.excluded)).toEqual([false, true, false]);
    expect(row.excludedCount).toBe(1);
  });

  it("ignores an exclusion for a store outside the scope", () => {
    const row = companyDeptRows([stores[0]], lotteryEverywhere, [
      { storeid: 502, sub_department: 61, sub_department_description: null },
    ])[0];
    expect(row.at).toHaveLength(1);
    expect(row.at[0].excluded).toBe(false);
  });

  it("drops a blank description rather than grouping every store under one", () => {
    const rows = companyDeptRows(
      stores,
      [
        ...lotteryEverywhere,
        { storeid: 501, sub_department: 99, description: "  ", lastRung: "2026-10-01" },
      ],
      [],
    );
    expect(rows).toHaveLength(1);
  });

  it("keeps both numbers when one store rings the same description twice", () => {
    const rows = companyDeptRows(
      [stores[0]],
      [
        lotteryEverywhere[0],
        { storeid: 501, sub_department: 72, description: "Lottery", lastRung: "2026-10-02" },
      ],
      [],
    );
    expect(rows[0].at.map((a) => a.sub_department)).toEqual([14, 72]);
  });
});

describe("deptState", () => {
  const row = (excludedStoreIds: number[]) =>
    companyDeptRows(
      stores,
      lotteryEverywhere,
      excludedStoreIds.map((storeid) => ({
        storeid,
        sub_department: storeid === 501 ? 14 : 61,
        sub_department_description: "Lottery",
      })),
    )[0];

  it("is none when nothing is excluded", () => {
    expect(deptState(row([]))).toBe("none");
  });

  it("is some part-way through an onboarding", () => {
    expect(deptState(row([502]))).toBe("some");
  });

  it("is all only when every store holding it is excluded", () => {
    expect(deptState(row([501, 502, 503]))).toBe("all");
  });
});

describe("planToggle", () => {
  const partlyDone = companyDeptRows(stores, lotteryEverywhere, [
    { storeid: 502, sub_department: 61, sub_department_description: "Lottery" },
  ])[0];

  it("writes only the stores that disagree, so the count means stores changed", () => {
    const plan = planToggle(partlyDone, true);
    expect(plan).toHaveLength(2);
    expect(plan.map((w) => w.storeid).sort()).toEqual([501, 503]);
  });

  it("sends each store its own number", () => {
    const plan = planToggle(partlyDone, true);
    expect(
      plan.map((w) => [w.storeid, w.sub_department]).sort((a, b) => a[0] - b[0]),
    ).toEqual([
      [501, 14],
      [503, 61],
    ]);
  });

  it("removes from only the store that has one", () => {
    const plan = planToggle(partlyDone, false);
    expect(plan).toEqual([
      { op: "remove", storeid: 502, sub_department: 61 },
    ]);
  });

  it("is empty when the row already reads the way it is being asked to", () => {
    expect(planToggle(partlyDone, true).length).toBeGreaterThan(0);
    const allOn = companyDeptRows(
      stores,
      lotteryEverywhere,
      planToggle(partlyDone, true)
        .map((w) => ({
          storeid: w.storeid,
          sub_department: w.sub_department,
          sub_department_description: null,
        }))
        .concat([
          { storeid: 502, sub_department: 61, sub_department_description: null },
        ]),
    )[0];
    expect(planToggle(allOn, true)).toEqual([]);
  });

  it("names a department by the group label, not a store's own casing", () => {
    const [write] = planToggle(
      companyDeptRows([stores[2]], [lotteryEverywhere[2]], [])[0],
      true,
    );
    expect(write).toMatchObject({ op: "add", sub_department_description: "lottery" });
  });
});

describe("planStoreToggle", () => {
  it("touches one store out of a row that spans three", () => {
    const row = companyDeptRows(stores, lotteryEverywhere, [])[0];
    expect(planStoreToggle(row, 503, true)).toEqual([
      {
        op: "add",
        storeid: 503,
        sub_department: 61,
        sub_department_description: row.label,
      },
    ]);
  });

  it("does nothing for a store that does not have the department", () => {
    const row = companyDeptRows(stores, [lotteryEverywhere[0]], [])[0];
    expect(planStoreToggle(row, 502, true)).toEqual([]);
  });
});

describe("coverageText", () => {
  it("says so when it is counting everywhere", () => {
    expect(coverageText(companyDeptRows(stores, lotteryEverywhere, [])[0])).toBe(
      "counted in net sales at all 3",
    );
  });

  it("counts part-way through", () => {
    const row = companyDeptRows(stores, lotteryEverywhere, [
      { storeid: 502, sub_department: 61, sub_department_description: null },
    ])[0];
    expect(coverageText(row)).toBe("excluded at 1 of 3 stores");
  });

  it("separates the stores that do not have it from the ones not excluded", () => {
    const row = companyDeptRows(stores, [lotteryEverywhere[0]], [])[0];
    expect(coverageText(row)).toBe("counted in net sales at all 1 · not present at 2");
  });

  it("counts a store once even when it rings the department twice", () => {
    const row = companyDeptRows(
      [stores[0]],
      [
        lotteryEverywhere[0],
        { storeid: 501, sub_department: 72, description: "LOTTERY", lastRung: "2026-10-02" },
      ],
      [
        { storeid: 501, sub_department: 14, sub_department_description: null },
        { storeid: 501, sub_department: 72, sub_department_description: null },
      ],
    )[0];
    expect(coverageText(row)).toBe("excluded at this store");
  });
});

describe("differingNumbers", () => {
  it("is empty when every store agrees, so the UI stays quiet", () => {
    const row = companyDeptRows(
      [stores[1], stores[2]],
      [lotteryEverywhere[1], lotteryEverywhere[2]],
      [],
    )[0];
    expect(differingNumbers(row)).toEqual([]);
  });

  it("spells out the mapping when they do not", () => {
    const row = companyDeptRows(stores, lotteryEverywhere, [])[0];
    expect(differingNumbers(row)).toEqual([
      "018 → #14",
      "020 → #61",
      "021 → #61",
    ]);
  });
});
