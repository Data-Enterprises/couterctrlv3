export type TotalsSummary = {
  weight: number;
  cost: number;
  retail: number; // active retail
  qty: number;
  eret: number; // active retail * qty if weight is 0, otherwise use weight
  vendors: number; // unique vendors
  categories: number; // unique categories
};

export const defaultSummary: TotalsSummary = {
  weight: 0,
  cost: 0,
  retail: 0,
  qty: 0,
  eret: 0,
  vendors: 0,
  categories: 0,
};