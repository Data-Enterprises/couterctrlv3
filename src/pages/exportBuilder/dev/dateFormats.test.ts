import { describe, expect, it } from "vitest";
import {
  DATE_FORMATS,
  formatDateValue,
  isDateColumn,
  isKnownDateFormat,
} from "./dateFormats";

describe("how a date is written in the file", () => {
  const stored = "2026-09-14T14:30:05";

  it("writes the patterns it offers", () => {
    expect(formatDateValue(stored, "YYYY-MM-DD")).toBe("2026-09-14");
    expect(formatDateValue(stored, "MM/DD/YYYY")).toBe("09/14/2026");
    expect(formatDateValue(stored, "DD/MM/YYYY")).toBe("14/09/2026");
    expect(formatDateValue(stored, "YYYY/MM/DD")).toBe("2026/09/14");
    expect(formatDateValue(stored, "MM/DD/YYYY HH24:MI")).toBe(
      "09/14/2026 14:30",
    );
    expect(formatDateValue(stored, "YYYY-MM-DD HH24:MI:SS")).toBe(
      "2026-09-14 14:30:05",
    );
  });

  it("reads HH24 as one token, not HH and 24", () => {
    expect(formatDateValue("2026-09-14T09:05:00", "HH24:MI")).toBe("09:05");
  });

  it("leaves midnight on the day it was stored", () => {
    // The stored value carries no zone: it is that day at the store. Read
    // locally, midnight becomes the evening before west of Greenwich.
    expect(formatDateValue("2026-09-14T00:00:00", "MM/DD/YYYY")).toBe(
      "09/14/2026",
    );
    expect(formatDateValue("2026-09-14", "MM/DD/YYYY")).toBe("09/14/2026");
  });

  it("leaves alone what it cannot read, and what it was not asked to change", () => {
    expect(formatDateValue("not a date", "MM/DD/YYYY")).toBe("not a date");
    expect(formatDateValue(stored, "")).toBe(stored);
    expect(formatDateValue(null, "MM/DD/YYYY")).toBeNull();
  });

  it("applies to date and timestamp columns and nothing else", () => {
    expect(isDateColumn("date")).toBe(true);
    expect(isDateColumn("timestamp without time zone")).toBe(true);
    expect(isDateColumn("timestamp with time zone")).toBe(true);
    // A time has no date in it, and a varchar holding one is text the
    // endpoint could not convert either.
    expect(isDateColumn("time without time zone")).toBe(false);
    expect(isDateColumn("character varying")).toBe(false);
  });

  it("only offers patterns the endpoint will accept", () => {
    for (const format of DATE_FORMATS) {
      if (format.value === "") continue;
      expect(isKnownDateFormat(format.value)).toBe(true);
    }
    expect(isKnownDateFormat("YYYY'; drop table users --")).toBe(false);
  });
});
