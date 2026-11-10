/** One tab of the phone detail view. */
export interface DetailTab<K extends string> {
  key: K;
  label: string;
}

/** One sort chip on the phone. */
export interface SortOption<K extends string> {
  key: K;
  label: string;
}
