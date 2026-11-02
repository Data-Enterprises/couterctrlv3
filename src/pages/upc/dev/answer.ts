/**
 * What a marketing/* answer says about the UPCs it was asked for.
 *
 * Those endpoints answer `error: 1` both when they failed and when the UPCs
 * simply sold nothing in the window: "No data was returned." comes back with
 * `success: true`, a real failure with `success: false`. Only a failure should
 * leave the UPCs unfetched. An empty answer is still an answer and covers
 * them; treating it as a failure meant every visit to the tab asked again,
 * warned again, and paid for the call again.
 */
export type UpcAnswer = "ok" | "empty" | "failed";

export const answerOf = (
  j: { error?: number; success?: boolean } | null | undefined,
): UpcAnswer => {
  if (!j) return "failed";
  if (j.error === 0) return "ok";
  return j.success === true ? "empty" : "failed";
};

/** Why a call failed, in words for the screen: the server's reason when it
 *  sent one as a sentence, else its status, else that it couldn't be reached.
 *  axios puts a refused call's body under `response.data`. */
export const failureReason = (err: unknown): string => {
  const e = err as { response?: { status?: number; data?: { detail?: unknown; msg?: unknown } } };
  const body = e.response?.data;
  const said = typeof body?.detail === "string" ? body.detail : typeof body?.msg === "string" ? body.msg : "";
  if (said) return said;
  if (e.response?.status) return `error ${e.response.status}`;
  return "the server couldn't be reached";
};
