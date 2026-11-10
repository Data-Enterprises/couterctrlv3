// Interfaces
import type { AllOrder } from "../../../../../interfaces";

/**
 * The columns an order-line export can carry.
 *
 * Lifted out of `ordersCols`, which is an ag-grid definition — flex widths,
 * cell classes, header borders — none of which a CSV has any use for. Same
 * fields and same names, so a column means here what it means on the grid.
 */
export type OrderExportColumn = {
  field: keyof AllOrder;
  headerName: string;
};
