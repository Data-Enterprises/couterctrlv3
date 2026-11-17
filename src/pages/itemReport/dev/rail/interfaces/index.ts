// Interfaces

/** One figure in a rail row, with an optional tone class. */
export interface Cell {
  text: string;
  tone?: string;
}

/** How one rail section folds: its stable id, whether it is folded, and the
 *  toggle. Built in one place so the sections can't drift on the key. */
export interface Fold {
  id: string;
  collapsed: boolean;
  onToggle: () => void;
}
