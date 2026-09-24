import axios from "axios";

/**
 * Saved queries, on the `user_queries` table.
 *
 * Four ordinary REST calls rather than the POST-everything shape the rest of
 * this API uses, because that is what the router exposes. Scope is the token's
 * user: another user's id answers 404 rather than 403, since the caller has no
 * business learning whether that row exists.
 *
 * `sql` is stored and handed back and **never executed** — the router has no
 * run endpoint and must not grow one. The same table holds real SQL saved by
 * developers from their own query window (REINDEX, INSERT INTO stores), so an
 * execute endpoint would hand every signed-in caller the database.
 */

/**
 * Two labels on one table, and they hold different things.
 *
 * A **config** is the contract's own convention: `project: "sales_export"`,
 * with the configuration JSON in `sql`. That label is what the export's
 * `userQueryId` points at.
 *
 * A **query** is this page's scratchpad text, which is not a configuration
 * and would be nonsense to a build. It gets its own label so one GET does not
 * come back holding both shapes.
 *
 * Both keep clear of the unlabelled rows: the table is shared with the
 * developer query window, whose rows are real SQL — REINDEX, INSERT INTO
 * stores — and a developer who also uses this page should not find those
 * here.
 */
export const SALES_EXPORT_PROJECT = "sales_export";
export const SALES_EXPORT_QUERY_PROJECT = "sales_export_query";

export interface SavedQuery {
  id: number;
  userid: number;
  name: string;
  description: string | null;
  project: string | null;
  /** The query text. Opaque to the API. */
  sql: string;
  created_at: string;
  updated_at: string;
}

export interface SavedQueriesResp {
  error: number;
  success: boolean;
  count: number;
  /** Every label this user has, so a filter needs no second call. */
  projects: string[];
  queries: SavedQuery[];
}

export interface SavedQueryResp {
  error: number;
  success: boolean;
  query: SavedQuery;
}

export interface DeletedQueryResp {
  error: number;
  success: boolean;
  /** The whole row that was removed, so an undo can post it back without
   *  this page having kept a copy. */
  deleted: SavedQuery;
}

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
});

export const listSavedQueries = (
  url: string,
  token: string,
  project: string = SALES_EXPORT_QUERY_PROJECT,
) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "user_queries/",
    params: { project },
  });

export const createSavedQuery = (
  url: string,
  token: string,
  body: { name: string; sql: string; description?: string | null; project?: string },
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "user_queries/",
    data: { project: SALES_EXPORT_QUERY_PROJECT, ...body },
  });

/**
 * Only what is sent changes — a rename carries the name and nothing else, so
 * there is no payload to re-serialise and no chance of writing back a stale
 * one.
 */
export const updateSavedQuery = (
  url: string,
  token: string,
  id: number,
  body: Partial<Pick<SavedQuery, "name" | "sql" | "description" | "project">>,
) =>
  axios({
    method: "PUT",
    headers: headers(token),
    url: url + "user_queries/" + id,
    data: body,
  });

export const deleteSavedQuery = (url: string, token: string, id: number) =>
  axios({
    method: "DELETE",
    headers: headers(token),
    url: url + "user_queries/" + id,
  });
