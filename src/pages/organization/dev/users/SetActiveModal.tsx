import { useState } from "react";
import {
  CheckCircleIcon,
  MinusCircleIcon,
  NoSymbolIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import {
  setUsersActive,
  type SetActiveResult,
} from "../../../../api/team";
import type { JsonError, User } from "../../../../interfaces";

interface SetActiveModalProps {
  /** Exactly the people the button promised — the grid passes what was
   *  ticked AND is on screen, so nobody hidden by a filter rides along. */
  users: User[];
  /** 0 deactivates, 1 reactivates. Same screen either way. */
  active: 0 | 1;
  /** `changed` is true when anybody actually moved, so the grid knows to
   *  re-read the lists and drop its selection. */
  onClose: (changed: boolean) => void;
}

type Outcome =
  | { kind: "changed" }
  | { kind: "unchanged" }
  | { kind: "refused"; reason: string }
  | { kind: "not_found" };

/**
 * Deactivate or reactivate several people at once, after naming every one.
 *
 * ### Two states, one list
 *
 * **Before:** the list is the promise. Every name that will be sent is on it,
 * with their level, and the button counts them. Nothing is sent until it is
 * pressed.
 *
 * **After:** the same list, each row now saying what happened to that person.
 * `users/set_active` reports every name in exactly one of four ways —
 * changed, already in that state, refused with a reason, or not found — and
 * partial success is the normal case: one person outside your companies does
 * not stop the other nine. A toast saying "Done" would hide exactly the rows
 * that need reading, so the result stays on screen until it is dismissed.
 *
 * ### What it does not do
 *
 * Nothing but `users.active` moves. Companies, base groups and stores are
 * kept, so reactivating gives somebody back exactly what they had — and the
 * copy says so, because "deactivate" next to a list of colleagues reads as
 * far more final than it is.
 */
const SetActiveModal = ({ users, active, onClose }: SetActiveModalProps) => {
  const ctx = useOrganizationCtx();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SetActiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verb = active === 0 ? "Deactivate" : "Reactivate";
  const n = users.length;
  const people = `${n} user${n === 1 ? "" : "s"}`;

  const levelName = (lvl: number) =>
    ctx.userLevels.find((l) => l.id === lvl)?.name ?? `Level ${lvl}`;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const resp = await setUsersActive(
        ctx.url,
        ctx.token,
        users.map((u) => u.username),
        active,
      );
      if (resp.data.error !== 0) {
        setError(resp.data.msg ?? "The server refused the request.");
      } else {
        setResult(resp.data);
      }
    } catch (err) {
      setError((err as JsonError).message);
    }
    setSending(false);
  };

  /** What happened to one person, matched without case as the server does. */
  const outcomeOf = (username: string): Outcome | null => {
    if (!result) return null;
    const is = (list: string[]) =>
      list.some((x) => x.toLowerCase() === username.toLowerCase());
    if (is(result.changed)) return { kind: "changed" };
    if (is(result.unchanged)) return { kind: "unchanged" };
    const refused = result.refused.find(
      (r) => r.username.toLowerCase() === username.toLowerCase(),
    );
    if (refused) return { kind: "refused", reason: refused.reason };
    if (is(result.not_found)) return { kind: "not_found" };
    return null;
  };

  const done = result !== null;
  const changedCount = result?.changed.length ?? 0;
  const notDone = n - changedCount - (result?.unchanged.length ?? 0);

  const summary = () => {
    if (!result) return "";
    const past = active === 0 ? "deactivated" : "reactivated";
    const bits = [`${changedCount} ${past}`];
    if (result.unchanged.length > 0) {
      bits.push(
        `${result.unchanged.length} already ${active === 0 ? "inactive" : "active"}`,
      );
    }
    if (notDone > 0) bits.push(`${notDone} not changed`);
    return bits.join(" · ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-custom-white rounded-xl p-5 w-[460px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="text-[15px] font-semibold text-content mb-1.5 flex-shrink-0">
          {done ? `${verb} — result` : `${verb} ${people}`}
        </div>

        <p className="text-[12.5px] text-content/95 leading-relaxed mb-3 flex-shrink-0">
          {done
            ? summary()
            : active === 0
              ? "They lose access straight away — anyone signed in is signed out on their next click. Their companies, base groups and stores are kept, so reactivating gives it all back."
              : "They can sign in again, with the companies, base groups and stores they had when they were deactivated."}
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar border border-brand_line rounded-lg divide-y divide-brand_navy/15 mb-3">
          {users.map((u) => {
            const out = outcomeOf(u.username);
            const failed = out?.kind === "refused" || out?.kind === "not_found";
            const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
            return (
              <div
                key={u.id}
                className={`flex items-center gap-2.5 px-3 py-2 text-[12.5px] ${
                  failed ? "bg-brand_danger_bg" : ""
                }`}
              >
                <OutcomeIcon outcome={out} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-content truncate">
                    {u.username}
                  </div>
                  {name && (
                    <div className="text-[11.5px] text-content/95 truncate">
                      {name}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11.5px] flex-shrink-0 text-right ${
                    failed ? "text-brand_danger font-semibold" : "text-content/95"
                  }`}
                >
                  {out === null
                    ? levelName(u.user_level)
                    : out.kind === "changed"
                      ? active === 0
                        ? "Deactivated"
                        : "Reactivated"
                      : out.kind === "unchanged"
                        ? active === 0
                          ? "Already inactive"
                          : "Already active"
                        : out.kind === "refused"
                          ? capitalise(out.reason)
                          : "Not found"}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-[12px] text-brand_danger mb-3 flex-shrink-0">
            Nothing was changed. {error}
          </p>
        )}

        <div className="flex justify-end gap-2 flex-shrink-0">
          {done ? (
            <button
              onClick={() => onClose(changedCount > 0)}
              className="text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={() => onClose(false)}
                disabled={sending}
                className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={sending || n === 0}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white ${
                  active === 0
                    ? "bg-red-600 hover:bg-red-600/85"
                    : "bg-brand_navy hover:bg-brand_navy/85"
                }`}
              >
                {sending
                  ? active === 0
                    ? "Deactivating…"
                    : "Reactivating…"
                  : `${verb} ${people}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** Server reasons are lower-case phrases ("above your level") written to be
 *  read; on their own in a column they want a capital. */
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const OutcomeIcon = ({ outcome }: { outcome: Outcome | null }) => {
  const cls = "w-4 h-4 flex-shrink-0";
  if (outcome === null) return null;
  switch (outcome.kind) {
    case "changed":
      return <CheckCircleIcon className={`${cls} text-brand_navy`} />;
    case "unchanged":
      return <MinusCircleIcon className={`${cls} text-content/95`} />;
    case "refused":
      return <NoSymbolIcon className={`${cls} text-brand_danger`} />;
    case "not_found":
      return <ExclamationCircleIcon className={`${cls} text-brand_danger`} />;
  }
};

export default SetActiveModal;
