// Interfaces
import type { TransactionListItem } from "../../../interfaces";

/** An hhmmss time (leading zero optional) as hh:mm:ss. */
export const fmtTime = (raw: string) => {
  const s = raw.length === 5 ? "0" + raw : raw;
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4)}`;
};

/** A line's benefit stamps (FS, FSA, WIC), or null with none. */
export const renderStamps = (item: TransactionListItem) => {
  const stamps = [];
  if (item.fs > 0) stamps.push("FS");
  if (item.fsa > 0) stamps.push("FSA");
  if (item.wic > 0) stamps.push("WIC");
  return stamps.join(" · ") || null;
};

/** A line's type badge colour: grey when void, blue for tender, amber otherwise. */
export const typeBadgeClass = (isVoid: boolean, saleType: string) => {
  if (isVoid) return "bg-row_stripe text-brand_slate";
  return saleType === "Tender"
    ? "bg-blue-100 text-blue-800"
    : "bg-severity_watch_bg text-severity_watch_text";
};
