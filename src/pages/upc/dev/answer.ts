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
