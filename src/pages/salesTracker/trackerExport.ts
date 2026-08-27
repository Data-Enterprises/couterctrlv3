import type { SubDeptTotal } from "./trackerTotals";
import type { WindowPlan } from "./trackerWeeks";

interface ExportArgs {
  row: SubDeptTotal;
  scopeLabel: string;
  plan: WindowPlan;
}

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const num = (v: number | null, dp = 2) => (v === null ? "" : v.toFixed(dp));

/**
 * The open department as a spreadsheet: a row per week, then a row per day.
 *
 * Plain blob and an anchor click, never `navigator.share` — the share path
 * fails silently on mobile and leaves the user believing a file was written.
 */
export const exportTracker = ({ row, scopeLabel, plan }: ExportArgs) => {
  const lines: string[] = [];

  lines.push(`Sales Tracker,${esc(scopeLabel)}`);
  lines.push(`Sub department,${esc(row.desc)}`);
  lines.push(`Window,${plan.tyStart} to ${plan.tyEnd}`);
  lines.push(`Compared to,${plan.lyStart} to ${plan.lyEnd}`);
  lines.push("");

  const header = [
    "Level",
    "Label",
    "Start",
    "End",
    "TY Sales",
    "LY Sales",
    "Transactions",
    "ATS Sales",
    "$ vs LY",
    "% vs LY",
  ];
  lines.push(header.join(","));

  lines.push(
    [
      "Window",
      esc(row.desc),
      plan.tyStart,
      plan.tyEnd,
      num(row.salesTy),
      num(row.salesLy),
      row.trans,
      num(row.ats),
      num(row.dollarChange),
      num(row.pctChange),
    ].join(","),
  );

  for (const w of row.weeks) {
    lines.push(
      [
        "Week",
        `Week ${w.index + 1}`,
        w.start,
        w.end,
        num(w.salesTy),
        num(w.salesLy),
        w.trans,
        num(w.ats),
        num(w.dollarChange),
        num(w.pctChange),
      ].join(","),
    );
    for (const d of w.days) {
      lines.push(
        [
          "Day",
          new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "short",
          }),
          d.date,
          d.lyDate,
          num(d.salesTy),
          num(d.salesLy),
          d.trans,
          num(d.ats),
          num(d.dollarChange),
          num(d.pctChange),
        ].join(","),
      );
    }
  }

  if (plan.collisions.length > 0) {
    lines.push("");
    lines.push("Holiday pairing note");
    lines.push(
      esc(
        "These dates this year share a matched date last year, so their comparison counts the same last-year day twice: " +
          plan.collisions.join(" "),
      ),
    );
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-tracker_${row.desc.replace(/[^a-z0-9]+/gi, "-")}_${plan.tyStart}_${plan.tyEnd}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
