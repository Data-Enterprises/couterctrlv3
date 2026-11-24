// Utils
import { weight3 } from "./recapFormat";

/**
 * UPC, Description, Sub dept, Vendor, Sales (net), Qty, [Weight]. Fixed
 * widths for the figures so each head sits over its own numbers, and the
 * description takes the rest; a narrow panel tightens them.
 */
export const colsOf = (withPounds: boolean, narrow: boolean) =>
  narrow
    ? `100px minmax(0,1fr) 100px 100px 86px 56px${withPounds ? " 68px" : ""}`
    : `125px minmax(0,1fr) 125px 130px 96px 62px${withPounds ? " 82px" : ""}`;

/** Pounds to three places, no unit (the heading says Weight); a dash on an
 *  item sold by the each. */
export const lb = (n: number) => (n > 0 ? weight3(n) : "—");

/** Room above the bars for the busiest hour's figure, so it never meets the top. */
export const HEADROOM_PX = 20;
