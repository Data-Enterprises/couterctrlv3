/** The store an open sub department's items are fetched for, or null on the
 *  group card. `storeNumber` narrows an id that carries two stores. */
export type ItemScope = {
  key: string;
  storeid: number;
  storeNumber: string | null;
} | null;
