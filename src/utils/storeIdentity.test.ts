import { describe, expect, it } from "vitest";
import { combinedStoreName } from "./storeIdentity";

describe("combinedStoreName", () => {
  // Brooks 685 is store numbers 369 and 370 under one storeid. The combined
  // tab showed 369 $303.2K, 370 $121.2K and Both $424.4K -- with the last of
  // those headed "Bruces Foodland 369".
  it("names both locations on the combined view", () => {
    expect(combinedStoreName("Bruces Foodland 369", ["369", "370"])).toBe(
      "Bruces Foodland 369 + 370",
    );
  });

  it("swaps the number in place, leaving the rest of the name", () => {
    // The same care applyStoreNumberToName takes: the digits replaced are the
    // ones that ARE a store number, not a highway or a suite.
    expect(combinedStoreName("Foodland 369 (Hwy 431)", ["369", "370"])).toBe(
      "Foodland 369 + 370 (Hwy 431)",
    );
  });

  it("appends when the name embeds no store number", () => {
    expect(combinedStoreName("Bruces Foodland", ["369", "370"])).toBe(
      "Bruces Foodland 369 + 370",
    );
  });

  it("sorts, so the pair reads the same whichever order it arrives in", () => {
    expect(combinedStoreName("Foodland 370", ["370", "369"])).toBe(
      "Foodland 369 + 370",
    );
  });

  it("leaves an ordinary store alone", () => {
    // One number is nothing to combine, and the overwhelming majority of
    // stores are one number.
    expect(combinedStoreName("Bruces Foodland 361", ["361"])).toBe(
      "Bruces Foodland 361",
    );
    expect(combinedStoreName("Bruces Foodland 361", [])).toBe(
      "Bruces Foodland 361",
    );
  });
});
