// Utils
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { CAUSE_ORDER } from "../utils";

// Interfaces
import type { ItemVerdict } from "../interfaces";

// Components
import UpcContextMenu from "../../../../../components-dev/UpcContextMenu";

interface GridContextMenuProps {
  ctx: { x: number; y: number; upc: string };
  shown: ItemVerdict[];
  chosen: Set<string>;
  /** Narrow the Supply tab to these codes and go there. */
  onFind: (upcs: string) => void;
  onClose: () => void;
}

/** The grid's right-click menu: the selection first, then copy by cause. */
const GridContextMenu = ({ ctx, shown, chosen, onFind, onClose }: GridContextMenuProps) => {
  /**
   * Copying by CAUSE rather than by severity.
   *
   * The shared menu offers critical/watch/healthy out of the box, which are
   * threshold grades and mean nothing here. Causes are what somebody acts on:
   * the never-ordered list goes to a buyer and the didn't-arrive list goes to
   * a vendor, so those are the two lists worth having on a clipboard.
   *
   * Over the FILTERED set, so what gets copied is what is on screen.
   */
  const copyActions = CAUSE_ORDER.filter((c) => c !== "ahead")
    .map((c) => ({
      cause: c,
      upcs: shown.filter((i) => i.cause === c).map((i) => i.productCode),
    }))
    .filter((g) => g.upcs.length > 0)
    .map((g) => ({
      label: `Copy ${CAUSE_LABEL[g.cause].toLowerCase()} UPCs · ${g.upcs.length}`,
      onClick: () => navigator.clipboard.writeText(g.upcs.join(", ")),
    }));

  return (
    <UpcContextMenu
      x={ctx.x}
      y={ctx.y}
      upc={ctx.upc}
      allUpcs={shown.map((i) => i.productCode)}
      extraActions={
        /* The selection first, because a reader who has just picked
           out nine rows is right-clicking about those nine rows.
           "Ctrl-C" in a status strip is a thing you have to already
           know; a menu item is a thing you find. */
        chosen.size > 0
          ? [
              {
                /* The question a buyer asks of a never-ordered item
                   is "was it ever on an order at all" — which is
                   two tabs away and, until now, a UPC retyped by
                   hand. */
                label: `Find ${chosen.size} in orders and receipts`,
                onClick: () => {
                  onFind([...chosen].join(" "));
                },
              },
              ...copyActions,
            ]
          : copyActions
      }
      onClose={onClose}
    />
  );
};

export default GridContextMenu;
