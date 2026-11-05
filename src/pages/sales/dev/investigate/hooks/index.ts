// Hooks
import { useMemo, useRef, useState } from "react";

// Interfaces
import type { Cause, ItemVerdict } from "../utils/deptInvestigation";
import type { FilterKind } from "../interfaces";

/** The grid's four column filters and the list they leave. The cause filter
 *  is also set from the other tabs, which is why the page holds it. */
export const useItemFilters = (items: ItemVerdict[]) => {
  const [only, setOnly] = useState<Cause | null>(null);
  const [itemQ, setItemQ] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [upcQ, setUpcQ] = useState("");
  const [upcDraft, setUpcDraft] = useState("");
  const [vendorQ, setVendorQ] = useState("");

  /** Every vendor in the department, so the vendor filter is a list to pick
   *  from rather than a spelling to guess at. */
  const vendors = useMemo(
    () =>
      [...new Set(items.map((i) => i.vendorName).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  );

  const shown = useMemo(() => {
    const item = itemQ.trim().toLowerCase();
    const upc = upcQ.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!only || i.cause === only) &&
        (!item || i.description.toLowerCase().includes(item)) &&
        (!upc || i.productCode.toLowerCase().includes(upc)) &&
        (!vendorQ || i.vendorName === vendorQ),
    );
  }, [items, only, itemQ, upcQ, vendorQ]);

  const filterActive = (k: FilterKind) =>
    k === "item"
      ? !!itemQ
      : k === "upc"
        ? !!upcQ
        : k === "vendor"
          ? !!vendorQ
          : only !== null;

  /** Text filters commit on Apply; the two pickers have already committed by
   *  the time the button is reachable, so Apply just closes the popover. */
  const applyFilter = (k: FilterKind) => {
    if (k === "item") setItemQ(itemDraft);
    if (k === "upc") setUpcQ(upcDraft);
  };

  const clearFilter = (k: FilterKind) => {
    if (k === "item") {
      setItemQ("");
      setItemDraft("");
    }
    if (k === "upc") {
      setUpcQ("");
      setUpcDraft("");
    }
    if (k === "vendor") setVendorQ("");
    if (k === "cause") setOnly(null);
  };

  return {
    only,
    setOnly,
    itemDraft,
    setItemDraft,
    upcDraft,
    setUpcDraft,
    vendorQ,
    setVendorQ,
    vendors,
    shown,
    filterActive,
    applyFilter,
    clearFilter,
  };
};

/** The rows picked out in the grid, and the right-click menu over them. */
export const useRowSelection = (
  sorted: ItemVerdict[],
  picked: string | null,
  setPicked: (code: string | null) => void,
  show: (code: string) => void,
) => {
  /**
   * Rows picked out, by product code.
   *
   * The grid is a spreadsheet to everybody who uses one, and the thing they
   * try first is dragging across rows to take them somewhere else. Click
   * selects, shift extends, ctrl adds, and the copy keys put it on the
   * clipboard as tab-separated text — which is what a spreadsheet pastes.
   *
   * Opening the evidence moves to a double click for the same reason: a
   * single click on a spreadsheet row selects it, and a panel that opened
   * on the way to selecting three rows would be in the way three times.
   */
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  /** Where a shift-range measures from. */
  const anchor = useRef<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; upc: string } | null>(
    null,
  );

  /**
   * Click, shift-click, ctrl-click — the three a grid is expected to answer.
   *
   * Shift measures from the anchor through the SORTED list rather than the
   * page, so a range that crosses a page boundary is still a range; what is
   * off-screen is still selected and still copies.
   */
  const pickRow = (
    e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    code: string,
  ) => {
    const add = e.ctrlKey || e.metaKey;
    if (e.shiftKey && anchor.current) {
      const a = sorted.findIndex((r) => r.productCode === anchor.current);
      const b = sorted.findIndex((r) => r.productCode === code);
      if (a >= 0 && b >= 0) {
        const span = sorted
          .slice(Math.min(a, b), Math.max(a, b) + 1)
          .map((r) => r.productCode);
        setChosen(new Set(add ? [...chosen, ...span] : span));
        return;
      }
    }
    anchor.current = code;
    if (add) {
      const next = new Set(chosen);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setChosen(next);
      return;
    }

    /* A plain click opens the item. Shift and ctrl are what build a
       selection to copy, and they never open anything — so picking out
       nine rows does not throw the panel open nine times.

       Clicking the row that is already open closes it again, which is also
       the way back to nothing selected. */
    const only = chosen.size === 1 && chosen.has(code);
    setChosen(only ? new Set() : new Set([code]));
    if (only) setPicked(null);
    else show(code);
  };

  /** Picked out, either by the selection or by the rail. */
  const isOn = (code: string) => picked === code || chosen.has(code);

  return { chosen, setChosen, anchor, ctx, setCtx, pickRow, isOn };
};
