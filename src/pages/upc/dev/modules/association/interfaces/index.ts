// Interfaces

// deptId is the numeric sub_department, kept beside the label so membership
// is checked by number, not by description.
export type DepartmentCount = { deptId: number; label: string; count: number; revenue: number };

export type ContextMenuState = { x: number; y: number; upc: string };

export type SortCol = "qty" | "basket_count" | "revenue" | "avg_price";
