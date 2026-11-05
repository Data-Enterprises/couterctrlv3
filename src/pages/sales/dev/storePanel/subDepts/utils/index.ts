import { formatCurrency2 } from "../../../../../../utils";

export const money = (v: number) => formatCurrency2(v);

export const signed = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));

/** The left list: marker, name, the money, and the units behind it. */
export const LIST_COLS = "10px minmax(0,1fr) 88px 76px";
