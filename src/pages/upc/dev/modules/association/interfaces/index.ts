// Interfaces

// deptId is the numeric sub_department, kept alongside the display label so
// callers can check membership against getQueryDepartments' Set<number>
// (e.g. to split cross-sub-dept vs. same-as-seed) without string-matching
// descriptions, which aren't guaranteed to be a reliable join key.
export type DepartmentCount = { deptId: number; label: string; count: number; revenue: number };

export type ContextMenuState = { x: number; y: number; upc: string };

export type SortCol = "qty" | "basket_count" | "revenue" | "avg_price";
