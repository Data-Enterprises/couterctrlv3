import { describe, expect, it } from "vitest";
import { buildMarkdownsCsv, markdownsFileName } from "@/pages/markdowns/dev/export/utils";
import { MARKDOWN_COLUMNS } from "@/pages/markdowns/dev/utils";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";

const row = (over: Partial<MarkdownItem>) =>
  ({
    id: 1,
    order_date: "2026-11-03T00:00:00",
    storename: "Food Giant Hayti",
    markdown_percent: 25.06,
    description: "Strawberries, 1lb",
    weight: null,
    ...over,
  }) as MarkdownItem;

const pick = (...labels: string[]) => MARKDOWN_COLUMNS.filter((c) => labels.includes(c.label));

describe("buildMarkdownsCsv", () => {
  it("writes the chosen columns, under their headings, rows in the order given", () => {
    const csv = buildMarkdownsCsv([row({ id: 2 }), row({ id: 1 })], pick("id", "Date", "Store"));
    expect(csv.split("\n")).toEqual([
      "id,Date,Store",
      "2,03/11/2026,Food Giant Hayti",
      "1,03/11/2026,Food Giant Hayti",
    ]);
  });

  it("keeps numbers raw, quotes text with commas, and leaves blanks empty, in the grid's order", () => {
    const csv = buildMarkdownsCsv([row({})], pick("markdown_percent", "description", "weight"));
    expect(csv.split("\n")[0]).toBe("markdown_percent,weight,description");
    expect(csv.split("\n")[1]).toBe('25.06,,"Strawberries, 1lb"');
  });
});

describe("markdownsFileName", () => {
  it("names the file after the scope and dates, safe to save", () => {
    expect(markdownsFileName("301 - Food Giant", "11/01/2026", "11/08/2026")).toBe(
      "markdowns_301_Food_Giant_11_01_2026_11_08_2026.csv",
    );
  });
});
