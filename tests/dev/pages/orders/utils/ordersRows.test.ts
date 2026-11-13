import { describe, expect, it } from "vitest";
import { storeNamesIn } from "@/pages/orders/dev/utils/ordersRows";

// Interfaces
import type { AllOrder, Store } from "@/interfaces";

const line = (storeid: number, storenumber: string, storename = "PAYLOAD NAME") =>
  ({ storeid, storenumber, storename }) as AllOrder;
const store = (storeid: number, store_name: string) => ({ storeid, store_name }) as Store;

describe("storeNamesIn", () => {
  it("lists each store once, by the user's name for it, A to Z", () => {
    const rows = [line(2, "302"), line(1, "301"), line(2, "302")];
    const assigned = [store(1, "Food Giant Hayti"), store(2, "Food Giant Kennett")];
    expect(storeNamesIn(rows, assigned, [])).toEqual(["Food Giant Hayti", "Food Giant Kennett"]);
  });

  it("falls back to the group search's stores, then the store number, never the payload", () => {
    const rows = [line(3, "303"), line(4, "304")];
    expect(storeNamesIn(rows, [], [store(3, "Tupelo Market")])).toEqual(["Store 304", "Tupelo Market"]);
  });

  it("names a storeid that covers two stores by each one's own number", () => {
    const rows = [line(685, "369"), line(685, "370")];
    expect(storeNamesIn(rows, [store(685, "Bruces Foodland 369")], [])).toEqual([
      "Bruces Foodland 369",
      "Bruces Foodland 370",
    ]);
  });
});
