import { describe, expect, it } from "vitest";
import type { ScanRow } from "../../../features/dev/devUpcScannerSlice";
import { buildTagFile, tagFileLines, tagFileName, TAG_FILE_CODE } from "./tagFile";

const row = (raw: string, code: string, at = 0): ScanRow => ({
  raw,
  code,
  source: "gun",
  at,
  status: "named",
});

// Scanned milk, then bread. The screen holds them newest-first.
const batch = [row("072250010122", "7225001012", 2), row("041220576401", "4122057640", 1)];

describe("tagFileLines", () => {
  it("writes one row per UPC with the store on each", () => {
    expect(tagFileLines(batch, 18)).toEqual([
      "041220576401,18",
      "072250010122,18",
    ]);
  });

  it("writes them in the order they were scanned, not the order they are shown", () => {
    // The screen is newest-first so a scan lands where the clerk is looking.
    // The file reads as the aisle was walked.
    expect(tagFileLines(batch, 18)[0]).toContain("041220576401");
  });

  it("sends the printed code, so the check digit is not lost on the way out", () => {
    // Guards the decision, not the implementation: normalizing is one-way, so
    // flipping TAG_FILE_CODE to "normalized" throws away digits Pangea may
    // need. If that flip is deliberate, this test is the place to say so.
    expect(TAG_FILE_CODE).toBe("raw");
    expect(tagFileLines([row("041220576401", "4122057640")], 18)).toEqual([
      "041220576401,18",
    ]);
  });

  it("has nothing to say about an empty batch", () => {
    expect(tagFileLines([], 18)).toEqual([]);
  });
});

describe("buildTagFile", () => {
  it("heads the file and ends the last row", () => {
    expect(buildTagFile(batch, 18)).toBe(
      "upc,storeid\n041220576401,18\n072250010122,18\n",
    );
  });
});

describe("tagFileName", () => {
  it("names the batch by store and local time, so a folder of them sorts", () => {
    expect(tagFileName("018", 22, new Date(2026, 9, 14, 14, 12))).toBe(
      "upcs_018_2026-10-14_1412_22.csv",
    );
  });

  it("pads, so 9:02 AM does not sort after 10 AM", () => {
    expect(tagFileName("018", 4, new Date(2026, 9, 7, 9, 2))).toContain("_0902_");
  });
});
