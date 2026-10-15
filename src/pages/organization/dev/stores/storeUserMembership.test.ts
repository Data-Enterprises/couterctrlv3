import { describe, it, expect } from "vitest";
import {
  groupsNamed,
  listNames,
  summarizeAssign,
  summarizeUnassign,
  viaLabel,
} from "./storeUserMembership";

const skip = (userid: number, via: string | null, reason = "granted by a base group") => ({
  userid,
  reason,
  via,
});

describe("groupsNamed", () => {
  it("names a group once however many users it refused", () => {
    expect(groupsNamed([skip(1, "Zone 1"), skip(2, "Zone 1")])).toEqual([
      "Zone 1",
    ]);
  });

  it("keeps several groups in the order they appear", () => {
    expect(groupsNamed([skip(1, "Zone 1"), skip(2, "East")])).toEqual([
      "Zone 1",
      "East",
    ]);
  });

  it("ignores a refusal with no group behind it", () => {
    expect(groupsNamed([skip(1, null, "already has it")])).toEqual([]);
  });
});

describe("listNames", () => {
  it("reads as a sentence", () => {
    expect(listNames(["Zone 1"])).toBe("Zone 1");
    expect(listNames(["Zone 1", "East"])).toBe("Zone 1 and East");
    expect(listNames(["Zone 1", "East", "HC North"])).toBe(
      "Zone 1, East and HC North",
    );
  });

  it("is empty for nothing", () => {
    expect(listNames([])).toBe("");
  });
});

describe("summarizeAssign", () => {
  it("counts who gained it", () => {
    const s = summarizeAssign({ changed: [1, 2, 3], skipped: [] }, "053");
    expect(s.text).toBe("3 users given 053.");
    expect(s.tone).toBe("success");
  });

  it("is not an error when everyone already had it", () => {
    // A fine answer to have asked for, not a failure.
    const s = summarizeAssign(
      { changed: [], skipped: [skip(1, null, "already has it")] },
      "053",
    );
    expect(s.tone).toBe("success");
    expect(s.text).toContain("already had 053");
  });

  it("mentions the ones that needed nothing", () => {
    const s = summarizeAssign(
      { changed: [1], skipped: [skip(2, null, "already has it")] },
      "053",
    );
    expect(s.text).toBe("1 user given 053. 1 already had it.");
  });
});

describe("summarizeUnassign", () => {
  it("counts who lost it", () => {
    const s = summarizeUnassign({ changed: [1, 2], skipped: [] }, "053");
    expect(s.text).toBe("053 removed from 2 users.");
    expect(s.tone).toBe("success");
  });

  it("names the group when some were kept, and says where to fix it", () => {
    // The whole reason the endpoint returns names rather than a count.
    const s = summarizeUnassign(
      { changed: [1], skipped: [skip(2, "Zone 1"), skip(3, "Zone 1")] },
      "053",
    );
    expect(s.text).toContain("removed from 1 user");
    expect(s.text).toContain("2 users keep it — granted by Zone 1");
    expect(s.text).toContain("Change it on the group");
    expect(s.tone).toBe("error");
  });

  it("is an error when nothing could be removed", () => {
    const s = summarizeUnassign(
      { changed: [], skipped: [skip(1, "Zone 1")] },
      "053",
    );
    expect(s.tone).toBe("error");
    expect(s.text).toContain("was not removed from anyone");
    expect(s.text).toContain("Zone 1");
  });

  it("still says something useful when no group name came back", () => {
    const s = summarizeUnassign(
      { changed: [], skipped: [skip(1, null, "something else")] },
      "053",
    );
    expect(s.text).toContain("1 user could not be changed");
  });

  it("lists several groups properly", () => {
    const s = summarizeUnassign(
      { changed: [1], skipped: [skip(2, "Zone 1"), skip(3, "East")] },
      "053",
    );
    expect(s.text).toContain("granted by Zone 1 and East");
  });
});

describe("viaLabel", () => {
  it("says direct rather than leaving a blank", () => {
    // A blank reads as missing data; this is the opposite — the one grant no
    // group can take back.
    expect(viaLabel(null)).toBe("direct");
    expect(viaLabel("")).toBe("direct");
  });

  it("passes a group name through", () => {
    expect(viaLabel("Zone 1")).toBe("Zone 1");
  });
});
