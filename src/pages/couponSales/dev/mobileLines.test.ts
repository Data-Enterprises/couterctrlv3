import { describe, expect, it } from "vitest";
import { setupStore } from "../../../store";
import { resetAppSlice } from "../../../features/appSlice";
import { setCouponMobileLines } from "../../../features/dev/devCouponSalesSlice";
import { couponReceipt } from "../../../api/eventPerf/couponAdapter";
import type { CouponItem } from "../../../interfaces";

const line = (saleId: number, description: string) =>
  ({
    sale_id: saleId,
    product_description: description,
    qty: 1,
    coupon_amount: 1.5,
  }) as unknown as CouponItem;

describe("the phone receipt lines", () => {
  it("are held in the store, where a receipt resolves against them", () => {
    const store = setupStore();
    store.dispatch(
      setCouponMobileLines([line(7, "Cereal"), line(7, "Milk"), line(8, "Eggs")]),
    );
    const held = store.getState().dev.couponSales.mobileLines;
    expect(couponReceipt(held, "7").map((l) => l.description)).toEqual([
      "Cereal",
      "Milk",
    ]);
  });

  it("do not outlive a sign-out", () => {
    // Why they left module scope: a variable there kept the last user's week
    // of lines in memory after the store had been emptied.
    const store = setupStore();
    store.dispatch(setCouponMobileLines([line(7, "Cereal")]));
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.couponSales.mobileLines).toEqual([]);
  });
});
