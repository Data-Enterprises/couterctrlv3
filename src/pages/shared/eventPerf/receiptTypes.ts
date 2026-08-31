/** One line on a receipt. Both pages resolve to this — Coupon Sales from rows
 *  already in memory, Loss Prevention from a fetch — so the sheet that renders
 *  it never learns which page opened it. */
export interface ReceiptLine {
  description: string;
  qty: number;
  amount: number;
  /**
   * Tender lines sit below the total, the way they do on a till roll.
   *
   * Optional, and defaulting to an item, because only Loss Prevention's
   * payload distinguishes them. A page that cannot tell simply renders
   * everything as items, which is what it did before this existed.
   */
  kind?: "item" | "tender";
}
