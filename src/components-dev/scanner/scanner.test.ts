import { describe, expect, it } from "vitest";
import type { QuaggaJSResultObject } from "@ericblade/quagga2";
import { isWedgeScan } from "./useScanGun";
import {
  CONFIRM_READS,
  createReadConfirmer,
  createRepeatGuard,
} from "./confirmRead";

const input = (inputType: string, data: string | null) =>
  ({ inputType, data }) as unknown as InputEvent;

describe("isWedgeScan", () => {
  it("takes a whole barcode arriving in one insertText, as the MC2200 sends it", () => {
    expect(isWedgeScan(input("insertText", "290003007995"))).toBe(true);
    expect(isWedgeScan(input("insertText", "07000000"))).toBe(true); // UPC-E / EAN-8
    expect(isWedgeScan(input("insertText", "4006381333931"))).toBe(true); // EAN-13
  });

  it("leaves a person typing alone — one character per event", () => {
    expect(isWedgeScan(input("insertText", "2"))).toBe(false);
    expect(isWedgeScan(input("insertText", "2900030"))).toBe(false); // too short
  });

  it("leaves paste, autofill, deletes and Enter alone", () => {
    expect(isWedgeScan(input("insertFromPaste", "290003007995"))).toBe(false);
    expect(isWedgeScan(input("insertReplacementText", "290003007995"))).toBe(false);
    expect(isWedgeScan(input("deleteContentBackward", null))).toBe(false);
    expect(isWedgeScan(input("insertLineBreak", null))).toBe(false);
  });

  it("only takes digits", () => {
    expect(isWedgeScan(input("insertText", "COKE 12PK DIET"))).toBe(false);
    expect(isWedgeScan(input("insertText", "2900030079 95"))).toBe(false);
  });
});

/** A Quagga result for `code` whose digits decoded with `error`. */
const read = (code: string, error = 0.05) =>
  ({
    codeResult: {
      code,
      decodedCodes: [...code].map(() => ({ error, code: 0, start: 0, end: 0 })),
    },
  }) as unknown as QuaggaJSResultObject;

describe("createReadConfirmer", () => {
  it("accepts a code only once it repeats across consecutive frames", () => {
    const confirm = createReadConfirmer();
    for (let i = 1; i < CONFIRM_READS; i++) expect(confirm(read("036000291452"))).toBeNull();
    expect(confirm(read("036000291452"))).toBe("036000291452");
  });

  it("ignores a poorly decoded frame instead of counting it", () => {
    const confirm = createReadConfirmer();
    expect(confirm(read("036000291452"))).toBeNull();
    expect(confirm(read("036000291452", 0.4))).toBeNull(); // smudged — dropped
    expect(confirm(read("036000291452"))).toBeNull();
    expect(confirm(read("036000291452"))).toBe("036000291452");
  });

  it("starts over when a frame disagrees — a partial read off the guide doesn't repeat", () => {
    const confirm = createReadConfirmer();
    confirm(read("036000291452"));
    confirm(read("036000291452"));
    expect(confirm(read("036000291459"))).toBeNull(); // misread: streak restarts
    expect(confirm(read("036000291452"))).toBeNull();
    expect(confirm(read("036000291452"))).toBeNull();
    expect(confirm(read("036000291452"))).toBe("036000291452");
  });

  it("is ready for the next item after a confirmed read", () => {
    const confirm = createReadConfirmer();
    for (let i = 0; i < CONFIRM_READS; i++) confirm(read("036000291452"));
    expect(confirm(read("036000291452"))).toBeNull();
  });
});

describe("createRepeatGuard", () => {
  // The failure this exists for: the confirmer clears its streak on a
  // confirmed read, so a barcode left sitting in the guide confirms again a
  // few frames later. Item Lookup stops its camera on the read and never saw
  // it; a screen that keeps scanning collects the same tag over and over.
  it("takes a code once, then holds it off for the cooldown", () => {
    let now = 0;
    const accept = createRepeatGuard(2000, () => now);
    expect(accept("036000291452")).toBe(true);
    now = 1999;
    expect(accept("036000291452")).toBe(false);
    now = 2000;
    expect(accept("036000291452")).toBe(true);
  });

  it("holds each code off on its own clock, so two tags worked alternately both stick", () => {
    let now = 0;
    const accept = createRepeatGuard(2000, () => now);
    expect(accept("036000291452")).toBe(true);
    now = 500;
    expect(accept("041220576401")).toBe(true);
    now = 1000;
    // Back to the first one well inside its window: still held off, rather
    // than let through because something else was read in between.
    expect(accept("036000291452")).toBe(false);
  });

  it("lets a different code straight through", () => {
    const accept = createRepeatGuard();
    expect(accept("036000291452")).toBe(true);
    expect(accept("041220576401")).toBe(true);
  });
});
