// Utils
import { COLUMNS, tintOf } from "../../../utils/columns";

// Interfaces
import type { ItemVerdict } from "../../../interfaces";
import type { useRowSelection } from "../../../hooks";

// Components
import Bar from "../../../components/Bar";
import GridCellContent from "./GridCellContent";

interface GridRowProps {
  row: ItemVerdict;
  /** The row number shown in the sticky first column. */
  n: number;
  selection: ReturnType<typeof useRowSelection>;
  allIn: boolean;
  fmt: (v: number) => string;
}

/** One item row of the grid: click picks it, right-click opens the menu. */
const GridRow = ({ row: r, n, selection, allIn, fmt }: GridRowProps) => {
  const { chosen, setChosen, anchor, setCtx, pickRow, isOn } = selection;

  return (
    <tr
      onClick={(e) => pickRow(e, r.productCode)}
      className="cursor-pointer select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        /* Right-clicking outside the selection selects that row first, the
           way a grid does: otherwise the menu offers to copy nine rows that
           are nowhere near the one under the cursor. Inside it, the
           selection stands. */
        if (!chosen.has(r.productCode)) {
          anchor.current = r.productCode;
          setChosen(new Set([r.productCode]));
        }
        setCtx({
          x: e.clientX,
          y: e.clientY,
          upc: r.productCode,
        });
      }}
    >
      {/* The whole row, not just the gutter. The store columns paint their
          own tint, so a selected row used to show the fill on the index alone
          and nowhere else — the fill wins over the tint while the row is
          picked out, and the tints come back when it is not. */}
      <td
        className={`sticky left-0 z-10 border-r border-b px-2 py-1.5 text-right ${
          isOn(r.productCode)
            ? "cc-row-selected border-l-2 font-bold text-content"
            : "border-brand_line bg-custom-white text-content/95"
        }`}
      >
        {n}
      </td>
      {COLUMNS.map((c) => (
        <td
          key={c.key}
          className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${c.right ? "text-right" : ""} ${
            isOn(r.productCode) ? "bg-row_selected" : tintOf(c)
          }`}
        >
          {/* Masked until the orders and deliveries are in. Every item reads
              "not moving" on sales alone, which is a different accusation
              from the one it will carry a second later — and the reader may
              have acted on it by then. */}
          {c.key === "cause" && !allIn ? (
            <Bar w="88%" h={14} />
          ) : (
            <GridCellContent cell={c.render(r, fmt)} />
          )}
        </td>
      ))}
    </tr>
  );
};

export default GridRow;
