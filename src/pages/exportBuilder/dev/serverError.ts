/**
 * What the server said when a call failed, read from where axios keeps it.
 *
 * A rejected axios call carries the response under `response`, not on the
 * error itself, so `err.data` and `err.detail` are always undefined. The
 * export endpoint puts the useful part in FastAPI's `detail` -- the stores a
 * user no longer holds, the column it did not recognise, the sort key it
 * cannot find -- and reading the wrong place swallowed every one of them.
 */
type Rejected = {
  message?: string;
  status?: number;
  response?: { status?: number; data?: unknown };
};

export const serverStatus = (err: unknown): number | undefined => {
  const e = err as Rejected | null;
  return e?.response?.status ?? e?.status;
};

/**
 * FastAPI's `detail`: a sentence for an HTTPException, a list of
 * `{loc, msg}` for a request the model refused (422). Undefined when the
 * server sent neither, which is the network failure case.
 */
export const serverDetail = (err: unknown): string | undefined => {
  const data = (err as Rejected | null)?.response?.data as
    | { detail?: unknown; msg?: unknown }
    | undefined;
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === "object" ? (d as { msg?: unknown }).msg : d))
      .filter((m): m is string => typeof m === "string" && m.trim() !== "");
    if (msgs.length) return msgs.join("; ");
  }
  if (typeof data?.msg === "string" && data.msg.trim()) return data.msg;
  return undefined;
};

/** The server's reason when it gave one, else axios's own message. */
export const reasonOf = (err: unknown): string =>
  serverDetail(err) ?? (err as Rejected | null)?.message ?? "no response";
