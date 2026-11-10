/** One choice in a multi-select filter. */
export interface MultiSelectOption {
  label: string;
  value: string;
  /**
   * No row left that carries this value, once the OTHER filters are applied.
   *
   * Dropped from the list, so everything left in it is something that
   * returns rows -- UNLESS it is selected, in which case it is kept and said
   * so. A pick that quietly vanished would leave the screen empty with the
   * reason nowhere on it, and nothing to click to undo.
   */
  unavailable?: boolean;
}

/** One choice in a select filter. */
export interface SelectFilterOption {
  label: string;
  value: string;
}
