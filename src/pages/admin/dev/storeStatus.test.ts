import { describe, it, expect } from "vitest";
import {
  closedOn,
  statusOf,
  statusReported,
  withClosedMark,
  withoutClosedMark,
} from "./storeStatus";

describe("statusOf", () => {
  it("is unknown when the endpoint does not return the field", () => {
    expect(statusOf({})).toBe("unknown");
  });

  it("is open on a null, which is what the column holds for a live store", () => {
    expect(statusOf({ deactivated_at: null })).toBe("open");
  });

  it("is closed on a real timestamp", () => {
    expect(statusOf({ deactivated_at: "2026-10-07T20:59:13.796043" })).toBe(
      "closed",
    );
  });

  /**
   * The bug this function was written twice for.
   *
   * The unassigned half of the stores endpoint goes through `pd.merge`, which
   * types a column holding any real timestamp as datetime64 and turns its
   * nulls into NaT — and NaT leaves Python as a STRING. Testing `!== null`
   * put every one of those in the closed branch, so closing a single store
   * made the whole list read as closed.
   */
  it("is open on NaT, however non-null that string is", () => {
    expect(statusOf({ deactivated_at: "NaT" })).toBe("open");
  });

  it("is open on NaN and on an empty string", () => {
    expect(statusOf({ deactivated_at: "NaN" })).toBe("open");
    expect(statusOf({ deactivated_at: "" })).toBe("open");
  });

  it("is open on anything else that is not a date", () => {
    expect(statusOf({ deactivated_at: "not a date" })).toBe("open");
  });
});

describe("statusReported", () => {
  it("asks about the field, not the value — all-open still counts", () => {
    expect(statusReported([{ deactivated_at: null }, { deactivated_at: null }])).toBe(
      true,
    );
  });

  it("is false only while nothing carries it at all", () => {
    expect(statusReported([{}, {}])).toBe(false);
  });

  it("takes one store carrying it as enough", () => {
    expect(statusReported([{}, { deactivated_at: "2026-10-07T20:59:13" }])).toBe(
      true,
    );
  });

  it("is false for an empty list rather than claiming to know", () => {
    expect(statusReported([])).toBe(false);
  });
});

describe("closedOn", () => {
  it("gives the day and drops the time", () => {
    expect(closedOn("2026-10-07T20:59:13.796043")).toBe("Oct 7, 2026");
  });

  it("gives nothing rather than Invalid Date", () => {
    expect(closedOn("NaT")).toBe("");
    expect(closedOn("")).toBe("");
  });
});

describe("the CLOSED marker in the name", () => {
  it("appends the marker", () => {
    expect(withClosedMark("614 - PW")).toBe("614 - PW CLOSED");
  });

  it("does not append it twice", () => {
    expect(withClosedMark("151 - SAL CLOSED")).toBe("151 - SAL CLOSED");
  });

  it("leaves a lower-cased marker alone rather than stacking on it", () => {
    expect(withClosedMark("151 - SAL closed")).toBe("151 - SAL closed");
  });

  it("strips the marker", () => {
    expect(withoutClosedMark("042 - IGA COOKEVILLE TN CLOSED")).toBe(
      "042 - IGA COOKEVILLE TN",
    );
  });

  it("strips however it was cased", () => {
    expect(withoutClosedMark("151 - SAL Closed")).toBe("151 - SAL");
  });

  it("strips a marker that was added more than once by hand", () => {
    expect(withoutClosedMark("151 - SAL CLOSED Closed")).toBe("151 - SAL");
  });

  it("leaves CLOSED alone when it is part of the name rather than the end", () => {
    expect(withoutClosedMark("CLOSED LOOP GROCERY")).toBe("CLOSED LOOP GROCERY");
  });

  it("keeps the name rather than emptying it", () => {
    // A store actually called "CLOSED" is a bad name; no name is worse.
    expect(withoutClosedMark("CLOSED")).toBe("CLOSED");
  });

  it("round-trips", () => {
    const open = "614 - PW";
    expect(withoutClosedMark(withClosedMark(open))).toBe(open);
  });

  it("does not change a name that needs no change", () => {
    expect(withoutClosedMark("614 - PW")).toBe("614 - PW");
  });
});
