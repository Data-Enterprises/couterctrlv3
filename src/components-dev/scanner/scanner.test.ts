import { describe, expect, it } from "vitest";
import { isWedgeScan } from "./useScanGun";

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
