import { formatCurrency2 } from "../../../../../utils";

/** "12 PM", the way the Hourly tab writes an hour. */
export const hourLabel = (h: number) => {
  const x = ((h % 24) + 24) % 24;
  return x === 0 ? "12 AM" : x < 12 ? `${x} AM` : x === 12 ? "12 PM" : `${x - 12} PM`;
};

/** "12 PM – 1 PM". */
export const hourRange = (h: number) => `${hourLabel(h)} – ${hourLabel(h + 1)}`;

/**
 * "12 – 1 PM", or "11 AM – 12 PM" when the hour crosses noon or midnight: the
 * meridiem is written once when both ends share it, for a narrow column.
 */
export const hourSpan = (h: number) => {
  const a = hourLabel(h);
  const b = hourLabel(h + 1);
  const [an, am] = a.split(" ");
  return am === b.split(" ")[1] ? `${an} – ${b}` : `${a} – ${b}`;
};

/** "7a", "12p": an axis tick. */
export const hourTick = (h: number) => {
  const [n, m] = hourLabel(h).split(" ");
  return `${n}${m === "AM" ? "a" : "p"}`;
};

/** "Fri 10/30". Noon, so no time zone can move the day. */
export const dayLabel = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${d.getMonth() + 1}/${d.getDate()}`;
};

/** "Friday 10/30", for a heading. */
export const dayName = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday} ${d.getMonth() + 1}/${d.getDate()}`;
};

export const money = (n: number) => formatCurrency2(n);

/** Whole dollars, for a figure beside a chart. */
export const money0 = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const count = (n: number) => Math.round(n).toLocaleString("en-US");

export const one = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const pounds = one;

export const pct = (n: number) => `${Math.round(n)}%`;
