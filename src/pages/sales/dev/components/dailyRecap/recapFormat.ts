import { formatCurrency2 } from "../../../../../utils";

const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

/** "12 PM – 1 PM", the way the Hourly tab writes an hour. */
export const hourRange = (h: number) => `${ampm(h)} – ${ampm((h + 1) % 24)}`;

/** "Fri 10/30". Noon, so no time zone can move the day. */
export const dayLabel = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${d.getMonth() + 1}/${d.getDate()}`;
};

export const money = (n: number) => formatCurrency2(n);

export const count = (n: number) => Math.round(n).toLocaleString("en-US");

export const pounds = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const pct = (n: number) => `${n.toFixed(1)}%`;
